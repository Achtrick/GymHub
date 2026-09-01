using MongoDB.Driver;

public class NotificationService
{
    private readonly IMongoCollection<Notification> _notifications;

    public NotificationService(IMongoDatabase database)
    {
        _notifications = database.GetCollection<Notification>("notifications");
    }

    public async Task NotifyAsync(
        string recipientUserId,
        string type,
        string message,
        string link,
        string? actorUserId = null,
        string? actorFullName = null)
    {
        var notification = new Notification
        {
            UserId = recipientUserId,
            Type = type,
            Message = message,
            Link = link,
            ActorUserId = actorUserId,
            ActorFullName = actorFullName,
        };

        await _notifications.InsertOneAsync(notification);
    }
}
