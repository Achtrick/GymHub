using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class WeightEntry
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    public double BodyWeightKg { get; set; }

    // Relative URL under the static /uploads mount, e.g. "/uploads/<guid>.jpg".
    public string PhotoPath { get; set; } = string.Empty;

    // "pending" | "approved" | "rejected"
    public string Status { get; set; } = "pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
