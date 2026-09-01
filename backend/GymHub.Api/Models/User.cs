using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Email { get; set; } = string.Empty;

    // Null when the account was created via Google sign-in only.
    public string? PasswordHash { get; set; }

    // Null unless the account is linked to Google sign-in. Omitted from the
    // stored document (not just null) so the sparse unique index actually
    // treats non-Google accounts as not having the field.
    [BsonIgnoreIfNull]
    public string? GoogleId { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    // "male" | "female"
    public string? Sex { get; set; }

    // "user" | "admin" — always "user" at creation; promote manually via mongosh.
    public string Role { get; set; } = "user";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Athletic profile — used for the leaderboard (age, weight class) and
    // optional until the user fills it in from "My PRs".
    public DateTime? DateOfBirth { get; set; }

    public double? HeightCm { get; set; }

    public double? BodyWeightKg { get; set; }

    // Relative URL under the static /uploads mount, e.g. "/uploads/<guid>.jpg".
    public string? ProfilePicturePath { get; set; }

    // SHA-256 hex hash of the raw reset token (the raw token itself is only
    // ever emailed, never stored) — set on "forgot password", cleared once
    // used or expired.
    [BsonIgnoreIfNull]
    public string? PasswordResetTokenHash { get; set; }

    [BsonIgnoreIfNull]
    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    // Email/password registrations start unactivated and must click the
    // emailed activation link before they can log in. Google sign-ins never
    // need this (Google already verified the email), and accounts that
    // existed before this feature was added have no stored value for this
    // field, which the driver leaves at this default (true) — so they're
    // grandfathered in as activated rather than locked out.
    public bool IsActivated { get; set; } = true;

    [BsonIgnoreIfNull]
    public string? ActivationTokenHash { get; set; }

    [BsonIgnoreIfNull]
    public DateTime? ActivationTokenExpiresAt { get; set; }
}
