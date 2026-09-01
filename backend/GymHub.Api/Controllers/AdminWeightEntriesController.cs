using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/admin/weight-entries")]
[Authorize(Roles = "admin")]
public class AdminWeightEntriesController : ControllerBase
{
    private readonly IMongoCollection<WeightEntry> _weightEntries;
    private readonly IMongoCollection<User> _users;
    private readonly WeightEntryService _mapper;
    private readonly NotificationService _notifications;

    public AdminWeightEntriesController(
        IMongoDatabase database, WeightEntryService mapper, NotificationService notifications)
    {
        _weightEntries = database.GetCollection<WeightEntry>("weightEntries");
        _users = database.GetCollection<User>("users");
        _mapper = mapper;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult<List<WeightEntryDto>>> List(
        [FromQuery] string status = "pending",
        [FromQuery] int skip = 0,
        [FromQuery] int limit = Paging.DefaultLimit)
    {
        var entries = await _weightEntries.Find(e => e.Status == status)
            .SortByDescending(e => e.CreatedAt)
            .Skip(Paging.ClampSkip(skip))
            .Limit(Paging.ClampLimit(limit))
            .ToListAsync();

        return Ok(await _mapper.ToDtosAsync(entries));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<WeightEntryDto>> UpdateStatus(string id, UpdateSubmissionStatusRequest request)
    {
        var update = Builders<WeightEntry>.Update.Set(e => e.Status, request.Status);
        var entry = await _weightEntries.FindOneAndUpdateAsync(
            e => e.Id == id,
            update,
            new FindOneAndUpdateOptions<WeightEntry> { ReturnDocument = ReturnDocument.After });

        if (entry is null)
        {
            return NotFound();
        }

        if (request.Status == "approved")
        {
            await _users.UpdateOneAsync(
                u => u.Id == entry.UserId,
                Builders<User>.Update.Set(u => u.BodyWeightKg, entry.BodyWeightKg));
        }

        await _notifications.NotifyAsync(
            entry.UserId,
            "weight_status",
            $"Your bodyweight entry ({entry.BodyWeightKg}kg) was {request.Status}",
            "/");

        var dto = (await _mapper.ToDtosAsync(new List<WeightEntry> { entry })).First();
        return Ok(dto);
    }
}
