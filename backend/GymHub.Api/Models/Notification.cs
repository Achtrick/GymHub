using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class Notification
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // Recipient.
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    // "comment" | "like" | "mention" | "pr_status" | "weight_status" | "order_status"
    public string Type { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    // Frontend route to navigate to when the notification is clicked.
    public string Link { get; set; } = "/";

    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfNull]
    public string? ActorUserId { get; set; }

    [BsonIgnoreIfNull]
    public string? ActorFullName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; }
}
