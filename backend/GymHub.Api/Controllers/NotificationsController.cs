using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMongoCollection<Notification> _notifications;

    public NotificationsController(IMongoDatabase database)
    {
        _notifications = database.GetCollection<Notification>("notifications");
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> List(
        [FromQuery] int skip = 0, [FromQuery] int limit = Paging.DefaultLimit)
    {
        var items = await _notifications.Find(n => n.UserId == CurrentUserId)
            .SortByDescending(n => n.CreatedAt)
            .Skip(Paging.ClampSkip(skip))
            .Limit(Paging.ClampLimit(limit))
            .ToListAsync();

        return Ok(items.Select(NotificationDto.FromNotification));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> UnreadCount()
    {
        var count = await _notifications.CountDocumentsAsync(
            n => n.UserId == CurrentUserId && !n.IsRead);

        return Ok(new { count });
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        await _notifications.UpdateOneAsync(
            n => n.Id == id && n.UserId == CurrentUserId,
            Builders<Notification>.Update.Set(n => n.IsRead, true));

        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _notifications.UpdateManyAsync(
            n => n.UserId == CurrentUserId && !n.IsRead,
            Builders<Notification>.Update.Set(n => n.IsRead, true));

        return NoContent();
    }

    private string CurrentUserId =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing user id claim.");
}
