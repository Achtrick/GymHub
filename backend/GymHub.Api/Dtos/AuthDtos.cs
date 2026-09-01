using System.ComponentModel.DataAnnotations;

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required, RegularExpression("^(male|female)$")]
    public string Sex { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class GoogleLoginRequest
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    // Omitted for Google-only accounts setting a password for the first time.
    public string? CurrentPassword { get; set; }

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ActivateAccountRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
}

public class ResendActivationRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Sex { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public double? HeightCm { get; set; }
    public double? BodyWeightKg { get; set; }
    public int? Age { get; set; }
    public string? WeightClass { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public bool HasPassword { get; set; }

    public static UserDto FromUser(User user) => new()
    {
        Id = user.Id!,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        PhoneNumber = user.PhoneNumber,
        Sex = user.Sex,
        Role = user.Role,
        DateOfBirth = user.DateOfBirth,
        HeightCm = user.HeightCm,
        BodyWeightKg = user.BodyWeightKg,
        Age = AgeCalculator.Calculate(user.DateOfBirth),
        WeightClass = WeightClassCalculator.Calculate(user.Sex, user.BodyWeightKg),
        ProfilePictureUrl = user.ProfilePicturePath,
        HasPassword = user.PasswordHash != null,
    };
}

public class UpdateProfileRequest
{
    public DateTime? DateOfBirth { get; set; }

    [Range(50, 260)]
    public double? HeightCm { get; set; }

    [RegularExpression("^(male|female)$")]
    public string? Sex { get; set; }
}

public class UpdateProfileInfoRequest
{
    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public string PhoneNumber { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}
