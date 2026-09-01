using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private const long MaxPhotoBytes = 10_000_000; // 10 MB

    private readonly IMongoCollection<User> _users;
    private readonly UploadSettings _uploadSettings;

    public UsersController(IMongoDatabase database, UploadSettings uploadSettings)
    {
        _users = database.GetCollection<User>("users");
        _uploadSettings = uploadSettings;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await _users.Find(u => u.Id == CurrentUserId).FirstOrDefaultAsync();
        if (user is null)
        {
            return NotFound();
        }

        return Ok(UserDto.FromUser(user));
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<UserMentionDto>>> Search([FromQuery] string? q)
    {
        List<User> users;
        if (string.IsNullOrWhiteSpace(q))
        {
            // No query yet (user just typed "@") — show a starter list to pick from.
            users = await _users.Find(FilterDefinition<User>.Empty)
                .SortBy(u => u.FirstName)
                .Limit(8)
                .ToListAsync();
        }
        else
        {
            var pattern = System.Text.RegularExpressions.Regex.Escape(q.Trim());
            var regex = new MongoDB.Bson.BsonRegularExpression(pattern, "i");
            var filter = Builders<User>.Filter.Or(
                Builders<User>.Filter.Regex(u => u.FirstName, regex),
                Builders<User>.Filter.Regex(u => u.LastName, regex));

            users = await _users.Find(filter).Limit(8).ToListAsync();
        }

        return Ok(users
            .Where(u => u.Id != CurrentUserId)
            .Select(u => new UserMentionDto
            {
                Id = u.Id!,
                FullName = $"{u.FirstName} {u.LastName}",
                ProfilePictureUrl = u.ProfilePicturePath,
            })
            .ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PublicProfileDto>> GetPublicProfile(string id)
    {
        var user = await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null)
        {
            return NotFound();
        }

        return Ok(PublicProfileDto.FromUser(user));
    }

    [HttpPatch("me")]
    public async Task<ActionResult<UserDto>> UpdateMe(UpdateProfileRequest request)
    {
        var update = Builders<User>.Update
            .Set(u => u.DateOfBirth, request.DateOfBirth)
            .Set(u => u.HeightCm, request.HeightCm)
            .Set(u => u.Sex, request.Sex);

        var user = await _users.FindOneAndUpdateAsync(
            u => u.Id == CurrentUserId,
            update,
            new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After });

        if (user is null)
        {
            return NotFound();
        }

        return Ok(UserDto.FromUser(user));
    }

    [HttpPatch("me/info")]
    public async Task<ActionResult<UserDto>> UpdateInfo(UpdateProfileInfoRequest request)
    {
        var update = Builders<User>.Update
            .Set(u => u.FirstName, request.FirstName.Trim())
            .Set(u => u.LastName, request.LastName.Trim())
            .Set(u => u.PhoneNumber, request.PhoneNumber.Trim());

        var user = await _users.FindOneAndUpdateAsync(
            u => u.Id == CurrentUserId,
            update,
            new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After });

        if (user is null)
        {
            return NotFound();
        }

        return Ok(UserDto.FromUser(user));
    }

    [HttpPost("me/password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var user = await _users.Find(u => u.Id == CurrentUserId).FirstOrDefaultAsync();
        if (user is null)
        {
            return NotFound();
        }

        if (user.PasswordHash is not null)
        {
            if (string.IsNullOrEmpty(request.CurrentPassword) ||
                !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Your current password is incorrect." });
            }
        }

        var update = Builders<User>.Update.Set(
            u => u.PasswordHash, BCrypt.Net.BCrypt.HashPassword(request.NewPassword));
        await _users.UpdateOneAsync(u => u.Id == CurrentUserId, update);

        return NoContent();
    }

    [HttpPost("me/photo")]
    [RequestSizeLimit(MaxPhotoBytes)]
    public async Task<ActionResult<UserDto>> UploadPhoto(IFormFile photo)
    {
        if (photo.Length == 0)
        {
            return BadRequest(new { message = "A photo file is required." });
        }

        if (!photo.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "The uploaded file must be a photo." });
        }

        Directory.CreateDirectory(_uploadSettings.Directory);

        var extension = Path.GetExtension(photo.FileName);
        var fileName = $"{Guid.NewGuid():N}{(string.IsNullOrWhiteSpace(extension) ? ".jpg" : extension)}";
        var filePath = Path.Combine(_uploadSettings.Directory, fileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await photo.CopyToAsync(stream);
        }

        var update = Builders<User>.Update.Set(u => u.ProfilePicturePath, $"/uploads/{fileName}");
        var user = await _users.FindOneAndUpdateAsync(
            u => u.Id == CurrentUserId,
            update,
            new FindOneAndUpdateOptions<User> { ReturnDocument = ReturnDocument.After });

        if (user is null)
        {
            return NotFound();
        }

        return Ok(UserDto.FromUser(user));
    }

    private string CurrentUserId =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing user id claim.");
}
