using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class PrSubmission
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    // "squat" | "bench" | "deadlift"
    public string LiftType { get; set; } = string.Empty;

    public double WeightKg { get; set; }

    // Relative URL under the static /uploads mount, e.g. "/uploads/<guid>.mp4".
    public string VideoPath { get; set; } = string.Empty;

    // "pending" | "approved" | "rejected"
    public string Status { get; set; } = "pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<string> LikedByUserIds { get; set; } = new();
}
