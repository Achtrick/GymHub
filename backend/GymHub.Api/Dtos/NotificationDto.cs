public class NotificationDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public string? ActorUserId { get; set; }
    public string? ActorFullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }

    public static NotificationDto FromNotification(Notification n) => new()
    {
        Id = n.Id!,
        Type = n.Type,
        Message = n.Message,
        Link = n.Link,
        ActorUserId = n.ActorUserId,
        ActorFullName = n.ActorFullName,
        CreatedAt = n.CreatedAt,
        IsRead = n.IsRead,
    };
}
