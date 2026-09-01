using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IMongoCollection<Badge> _badges;
    private readonly IMongoCollection<User> _users;
    private readonly NotificationService _notifications;

    public AdminOrdersController(IMongoDatabase database, NotificationService notifications)
    {
        _badges = database.GetCollection<Badge>("badges");
        _users = database.GetCollection<User>("users");
        _notifications = notifications;
    }

    private static readonly Dictionary<string, string> OrderStatusLabels = new()
    {
        ["received"] = "received",
        ["in_shipping"] = "in shipping",
        ["shipped"] = "shipped",
    };

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> List(
        [FromQuery] int skip = 0, [FromQuery] int limit = Paging.DefaultLimit)
    {
        var orders = await _badges.Find(b => b.CardOrdered)
            .SortByDescending(b => b.CardOrderedAt)
            .Skip(Paging.ClampSkip(skip))
            .Limit(Paging.ClampLimit(limit))
            .ToListAsync();

        if (orders.Count == 0)
        {
            return Ok(new List<OrderDto>());
        }

        var userIds = orders.Select(o => o.UserId).Distinct().ToList();
        var users = await _users.Find(u => userIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id!, u => $"{u.FirstName} {u.LastName}");

        return Ok(orders
            .Select(o => OrderDto.FromBadge(o, userMap.GetValueOrDefault(o.UserId, "Unknown")))
            .ToList());
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(string id, UpdateOrderStatusRequest request)
    {
        var update = Builders<Badge>.Update.Set(b => b.OrderStatus, request.Status);
        var badge = await _badges.FindOneAndUpdateAsync(
            b => b.Id == id && b.CardOrdered,
            update,
            new FindOneAndUpdateOptions<Badge> { ReturnDocument = ReturnDocument.After });

        if (badge is null)
        {
            return NotFound();
        }

        var user = await _users.Find(u => u.Id == badge.UserId).FirstOrDefaultAsync();
        var fullName = user is null ? "Unknown" : $"{user.FirstName} {user.LastName}";

        var statusLabel = OrderStatusLabels.GetValueOrDefault(badge.OrderStatus, badge.OrderStatus);
        await _notifications.NotifyAsync(
            badge.UserId,
            "order_status",
            $"Your {badge.Tier} {badge.LiftType} card order is now {statusLabel}",
            $"/profile/{badge.UserId}");

        return Ok(OrderDto.FromBadge(badge, fullName));
    }
}
