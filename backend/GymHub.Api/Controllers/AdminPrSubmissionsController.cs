using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/admin/prs")]
[Authorize(Roles = "admin")]
public class AdminPrSubmissionsController : ControllerBase
{
    private readonly IMongoCollection<PrSubmission> _prs;
    private readonly PrSubmissionService _mapper;
    private readonly NotificationService _notifications;

    public AdminPrSubmissionsController(
        IMongoDatabase database, PrSubmissionService mapper, NotificationService notifications)
    {
        _prs = database.GetCollection<PrSubmission>("prSubmissions");
        _mapper = mapper;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult<List<PrSubmissionDto>>> List(
        [FromQuery] string status = "pending",
        [FromQuery] int skip = 0,
        [FromQuery] int limit = Paging.DefaultLimit)
    {
        var submissions = await _prs.Find(p => p.Status == status)
            .SortByDescending(p => p.CreatedAt)
            .Skip(Paging.ClampSkip(skip))
            .Limit(Paging.ClampLimit(limit))
            .ToListAsync();

        return Ok(await _mapper.ToDtosAsync(submissions, null));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<PrSubmissionDto>> UpdateStatus(string id, UpdateSubmissionStatusRequest request)
    {
        var update = Builders<PrSubmission>.Update.Set(p => p.Status, request.Status);
        var submission = await _prs.FindOneAndUpdateAsync(
            p => p.Id == id,
            update,
            new FindOneAndUpdateOptions<PrSubmission> { ReturnDocument = ReturnDocument.After });

        if (submission is null)
        {
            return NotFound();
        }

        await _notifications.NotifyAsync(
            submission.UserId,
            "pr_status",
            $"Your {submission.LiftType} PR was {request.Status}",
            $"/prs/{submission.Id}");

        var dto = (await _mapper.ToDtosAsync(new List<PrSubmission> { submission }, null)).First();
        return Ok(dto);
    }
}
