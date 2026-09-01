using System.ComponentModel.DataAnnotations;

public static class LiftTypes
{
    public static readonly string[] All = { "squat", "bench", "deadlift" };

    public static bool IsValid(string? liftType) => liftType is not null && All.Contains(liftType);
}

public class SubmitPrRequest
{
    [Required]
    public string LiftType { get; set; } = string.Empty;

    [Required, Range(1, 500)]
    public double WeightKg { get; set; }

    [Required]
    public IFormFile Video { get; set; } = null!;
}

public class UpdateSubmissionStatusRequest
{
    [Required, RegularExpression("^(approved|rejected)$")]
    public string Status { get; set; } = string.Empty;
}

public class CreateCommentRequest
{
    [Required, MaxLength(500)]
    public string Text { get; set; } = string.Empty;

    public string? ParentCommentId { get; set; }
}

public class PrSubmissionDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string? UserProfilePictureUrl { get; set; }
    public string LiftType { get; set; } = string.Empty;
    public double WeightKg { get; set; }
    public string VideoUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int LikeCount { get; set; }
    public bool LikedByMe { get; set; }
    public int CommentCount { get; set; }
}

public class CommentDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? ParentCommentId { get; set; }
}
