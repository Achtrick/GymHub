using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private static readonly TimeSpan ResetTokenLifetime = TimeSpan.FromHours(1);
    private static readonly TimeSpan ActivationTokenLifetime = TimeSpan.FromHours(24);

    private readonly IMongoCollection<User> _users;
    private readonly TokenService _tokenService;
    private readonly GoogleAuthSettings _googleSettings;
    private readonly EmailService _email;
    private readonly AppSettings _appSettings;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IMongoDatabase database,
        TokenService tokenService,
        IOptions<GoogleAuthSettings> googleSettings,
        EmailService email,
        IOptions<AppSettings> appSettings,
        IWebHostEnvironment environment,
        ILogger<AuthController> logger)
    {
        _users = database.GetCollection<User>("users");
        _tokenService = tokenService;
        _googleSettings = googleSettings.Value;
        _email = email;
        _appSettings = appSettings.Value;
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _users.Find(u => u.Email == email).AnyAsync())
        {
            return Conflict(new { message = "An account with this email already exists." });
        }

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Sex = request.Sex.ToLowerInvariant(),
            // Email/password sign-ups must click the activation link before
            // they can log in — unlike Google sign-in, nothing has verified
            // this email address is actually theirs yet.
            IsActivated = false,
        };

        await _users.InsertOneAsync(user);
        await SendActivationEmailAsync(user);

        return Ok(new { message = "Check your email to activate your account." });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.Find(u => u.Email == email).FirstOrDefaultAsync();

        if (user is null || user.PasswordHash is null ||
            !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActivated)
        {
            return StatusCode(403, new
            {
                message = "Please activate your account first — check your email for the activation link.",
                code = "account_not_activated",
            });
        }

        return Ok(new AuthResponse
        {
            Token = _tokenService.CreateToken(user),
            User = UserDto.FromUser(user),
        });
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin(GoogleLoginRequest request)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _googleSettings.ClientId },
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { message = "Invalid Google token." });
        }

        var email = payload.Email.Trim().ToLowerInvariant();
        var user = await _users.Find(u => u.GoogleId == payload.Subject || u.Email == email)
            .FirstOrDefaultAsync();

        if (user is null)
        {
            user = new User
            {
                Email = email,
                GoogleId = payload.Subject,
                FirstName = payload.GivenName ?? string.Empty,
                LastName = payload.FamilyName ?? string.Empty,
                // Google has already verified this email — no activation step needed.
                IsActivated = true,
            };
            await _users.InsertOneAsync(user);
        }
        else if (user.GoogleId is null)
        {
            var update = Builders<User>.Update.Set(u => u.GoogleId, payload.Subject);
            await _users.UpdateOneAsync(u => u.Id == user.Id, update);
            user.GoogleId = payload.Subject;
        }

        return Ok(new AuthResponse
        {
            Token = _tokenService.CreateToken(user),
            User = UserDto.FromUser(user),
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.Find(u => u.Email == email).FirstOrDefaultAsync();

        // Always respond the same way whether or not the account exists, so
        // this endpoint can't be used to check which emails are registered.
        if (user is not null)
        {
            var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var update = Builders<User>.Update
                .Set(u => u.PasswordResetTokenHash, Hash(rawToken))
                .Set(u => u.PasswordResetTokenExpiresAt, DateTime.UtcNow.Add(ResetTokenLifetime));
            await _users.UpdateOneAsync(u => u.Id == user.Id, update);

            var resetLink = $"{_appSettings.FrontendBaseUrl}/reset-password?token={rawToken}";

            if (_environment.IsDevelopment())
            {
                _logger.LogInformation("Password reset link for {Email}: {Link}", email, resetLink);
            }

            await _email.SendAsync(
                user.Email,
                $"{user.FirstName} {user.LastName}",
                "Reset your GymHub password",
                $"""
                <p>We received a request to reset your GymHub password.</p>
                <p><a href="{resetLink}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                """);
        }

        return Ok(new { message = "If that email is registered, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var tokenHash = Hash(request.Token);
        var user = await _users.Find(u =>
                u.PasswordResetTokenHash == tokenHash &&
                u.PasswordResetTokenExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();

        if (user is null)
        {
            return BadRequest(new { message = "This reset link is invalid or has expired." });
        }

        var update = Builders<User>.Update
            .Set(u => u.PasswordHash, BCrypt.Net.BCrypt.HashPassword(request.NewPassword))
            .Unset(u => u.PasswordResetTokenHash)
            .Unset(u => u.PasswordResetTokenExpiresAt);
        await _users.UpdateOneAsync(u => u.Id == user.Id, update);

        return NoContent();
    }

    [HttpPost("activate")]
    public async Task<ActionResult<AuthResponse>> Activate(ActivateAccountRequest request)
    {
        var tokenHash = Hash(request.Token);
        var user = await _users.Find(u =>
                u.ActivationTokenHash == tokenHash &&
                u.ActivationTokenExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();

        if (user is null)
        {
            return BadRequest(new { message = "This activation link is invalid or has expired." });
        }

        var update = Builders<User>.Update
            .Set(u => u.IsActivated, true)
            .Unset(u => u.ActivationTokenHash)
            .Unset(u => u.ActivationTokenExpiresAt);
        await _users.UpdateOneAsync(u => u.Id == user.Id, update);
        user.IsActivated = true;

        return Ok(new AuthResponse
        {
            Token = _tokenService.CreateToken(user),
            User = UserDto.FromUser(user),
        });
    }

    [HttpPost("resend-activation")]
    public async Task<IActionResult> ResendActivation(ResendActivationRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.Find(u => u.Email == email).FirstOrDefaultAsync();

        // Same generic response whether or not the account exists/needs
        // activation, so this can't be used to enumerate registered emails.
        if (user is not null && !user.IsActivated)
        {
            await SendActivationEmailAsync(user);
        }

        return Ok(new { message = "If that account needs activation, a new email has been sent." });
    }

    private async Task SendActivationEmailAsync(User user)
    {
        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var update = Builders<User>.Update
            .Set(u => u.ActivationTokenHash, Hash(rawToken))
            .Set(u => u.ActivationTokenExpiresAt, DateTime.UtcNow.Add(ActivationTokenLifetime));
        await _users.UpdateOneAsync(u => u.Id == user.Id, update);

        var activationLink = $"{_appSettings.FrontendBaseUrl}/activate?token={rawToken}";

        if (_environment.IsDevelopment())
        {
            _logger.LogInformation("Activation link for {Email}: {Link}", user.Email, activationLink);
        }

        await _email.SendAsync(
            user.Email,
            $"{user.FirstName} {user.LastName}",
            "Activate your GymHub account",
            $"""
            <p>Welcome to GymHub! Click the link below to activate your account.</p>
            <p><a href="{activationLink}">Activate my account</a>. This link expires in 24 hours.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            """);
    }

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user is null)
        {
            return NotFound();
        }

        return Ok(UserDto.FromUser(user));
    }
}
