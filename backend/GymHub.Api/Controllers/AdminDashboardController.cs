using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly IMongoCollection<User> _users;
    private readonly IMongoCollection<PrSubmission> _prs;
    private readonly IMongoCollection<Badge> _badges;
    private readonly IMongoCollection<WeightEntry> _weightEntries;

    public AdminDashboardController(IMongoDatabase database)
    {
        _users = database.GetCollection<User>("users");
        _prs = database.GetCollection<PrSubmission>("prSubmissions");
        _badges = database.GetCollection<Badge>("badges");
        _weightEntries = database.GetCollection<WeightEntry>("weightEntries");
    }

    [HttpGet("metrics")]
    public async Task<ActionResult<DashboardMetricsDto>> GetMetrics()
    {
        var since = DateTime.UtcNow.Date.AddDays(-29);
        var today = DateTime.UtcNow.Date;

        var totalUsers = await _users.CountDocumentsAsync(FilterDefinition<User>.Empty);
        var recentUsers = await _users.Find(u => u.CreatedAt >= since).ToListAsync();
        var usersByDay = recentUsers.GroupBy(u => u.CreatedAt.Date).ToDictionary(g => g.Key, g => g.Count());
        var usersBeforeWindow = totalUsers - recentUsers.Count;

        var allPrs = await _prs.Find(FilterDefinition<PrSubmission>.Empty).ToListAsync();
        var pendingPrs = allPrs.Count(p => p.Status == "pending");
        var approvedPrs = allPrs.Count(p => p.Status == "approved");

        var pendingWeightEntries = await _weightEntries.CountDocumentsAsync(w => w.Status == "pending");

        var orderedBadges = await _badges.Find(b => b.CardOrdered).ToListAsync();
        var totalRevenue = orderedBadges.Sum(b => b.OrderPriceEur ?? 0);
        var recentOrders = orderedBadges.Where(b => b.CardOrderedAt >= since).ToList();
        var revenueByDay = recentOrders
            .GroupBy(b => b.CardOrderedAt!.Value.Date)
            .ToDictionary(g => g.Key, g => g.Sum(b => b.OrderPriceEur ?? 0));
        var revenueBeforeWindow = totalRevenue - recentOrders.Sum(b => b.OrderPriceEur ?? 0);

        var userGrowth = new List<TrendPointDto>();
        var revenueTrend = new List<TrendPointDto>();
        double cumulativeUsers = usersBeforeWindow;
        double cumulativeRevenue = revenueBeforeWindow;

        for (var day = since; day <= today; day = day.AddDays(1))
        {
            cumulativeUsers += usersByDay.GetValueOrDefault(day, 0);
            cumulativeRevenue += revenueByDay.GetValueOrDefault(day, 0);
            var label = day.ToString("MMM d");
            userGrowth.Add(new TrendPointDto { Label = label, Value = cumulativeUsers });
            revenueTrend.Add(new TrendPointDto { Label = label, Value = Math.Round(cumulativeRevenue, 2) });
        }

        return Ok(new DashboardMetricsDto
        {
            TotalUsers = (int)totalUsers,
            NewUsersLast30Days = recentUsers.Count,
            TotalPrSubmissions = allPrs.Count,
            PendingPrSubmissions = pendingPrs,
            ApprovedPrSubmissions = approvedPrs,
            PendingWeightEntries = (int)pendingWeightEntries,
            TotalOrders = orderedBadges.Count,
            OrdersReceived = orderedBadges.Count(b => b.OrderStatus == "received"),
            OrdersInShipping = orderedBadges.Count(b => b.OrderStatus == "in_shipping"),
            OrdersShipped = orderedBadges.Count(b => b.OrderStatus == "shipped"),
            TotalRevenueEur = Math.Round(totalRevenue, 2),
            UserGrowth = userGrowth,
            RevenueTrend = revenueTrend,
        });
    }
}
