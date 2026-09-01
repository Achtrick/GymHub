using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/prs")]
[Authorize]
public class PrSubmissionsController : ControllerBase
{
    private const long MaxVideoBytes = 100_000_000; // 100 MB

    private readonly IMongoCollection<PrSubmission> _prs;
    private readonly IMongoCollection<Comment> _comments;
    private readonly IMongoCollection<User> _users;
    private readonly PrSubmissionService _mapper;
    private readonly UploadSettings _uploadSettings;
    private readonly NotificationService _notifications;

    public PrSubmissionsController(
        IMongoDatabase database,
        PrSubmissionService mapper,
        UploadSettings uploadSettings,
        NotificationService notifications)
    {
        _prs = database.GetCollection<PrSubmission>("prSubmissions");
        _comments = database.GetCollection<Comment>("comments");
        _users = database.GetCollection<User>("users");
        _mapper = mapper;
        _uploadSettings = uploadSettings;
        _notifications = notifications;
    }

    [HttpGet("feed")]
    public async Task<ActionResult<List<PrSubmissionDto>>> Feed(
        [FromQuery] int skip = 0, [FromQuery] int limit = Paging.DefaultLimit)
    {
        var submissions = await _prs.Find(p => p.Status == "approved")
            .SortByDescending(p => p.CreatedAt)
            .Skip(Paging.ClampSkip(skip))
            .Limit(Paging.ClampLimit(limit))
            .ToListAsync();

        return Ok(await _mapper.ToDtosAsync(submissions, CurrentUserId));
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<PrSubmissionDto>>> Mine(
        [FromQuery] int skip = 0, [FromQuery] int limit = Paging.DefaultLimit)
    {
        var submissions = await _prs.Find(p => p.UserId == CurrentUserId)
            .SortByDescending(p => p.CreatedAt)
            .Skip(Paging.ClampSkip(skip))
            .Limit(Paging.ClampLimit(limit))
            .ToListAsync();

        return Ok(await _mapper.ToDtosAsync(submissions, CurrentUserId));
    }

    // Approved lift history for a user's public profile — chronological, for
    // plotting progression per lift type.
    [HttpGet("by-user/{userId}")]
    public async Task<ActionResult<List<PrSubmissionDto>>> ByUser(string userId)
    {
        var submissions = await _prs.Find(p => p.UserId == userId && p.Status == "approved")
            .SortBy(p => p.CreatedAt)
            .ToListAsync();

        return Ok(await _mapper.ToDtosAsync(submissions, CurrentUserId));
    }

    // Single-PR detail page (opened from a notification, etc). Visible to
    // anyone once approved; while pending/rejected, only the owner or an
    // admin can still see it.
    [HttpGet("{id}")]
    public async Task<ActionResult<PrSubmissionDto>> GetById(string id)
    {
        var submission = await _prs.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (submission is null)
        {
            return NotFound();
        }

        if (submission.Status != "approved" &&
            submission.UserId != CurrentUserId &&
            !User.IsInRole("admin"))
        {
            return Forbid();
        }

        var dto = (await _mapper.ToDtosAsync(new List<PrSubmission> { submission }, CurrentUserId)).First();
        return Ok(dto);
    }

    [HttpPost]
    [RequestSizeLimit(MaxVideoBytes)]
    public async Task<ActionResult<PrSubmissionDto>> Create([FromForm] SubmitPrRequest request)
    {
        if (!LiftTypes.IsValid(request.LiftType))
        {
            return BadRequest(new { message = "liftType must be one of: squat, bench, deadlift." });
        }

        var currentUser = await _users.Find(u => u.Id == CurrentUserId).FirstOrDefaultAsync();
        if (string.IsNullOrEmpty(currentUser?.Sex))
        {
            return BadRequest(new { message = "Set your sex in Edit stats before submitting a PR." });
        }

        if (request.Video.Length == 0)
        {
            return BadRequest(new { message = "A video file is required." });
        }

        if (!request.Video.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "The uploaded file must be a video." });
        }

        Directory.CreateDirectory(_uploadSettings.Directory);

        var extension = Path.GetExtension(request.Video.FileName);
        var fileName = $"{Guid.NewGuid():N}{(string.IsNullOrWhiteSpace(extension) ? ".mp4" : extension)}";
        var filePath = Path.Combine(_uploadSettings.Directory, fileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await request.Video.CopyToAsync(stream);
        }

        var submission = new PrSubmission
        {
            UserId = CurrentUserId,
            LiftType = request.LiftType,
            WeightKg = request.WeightKg,
            VideoPath = $"/uploads/{fileName}",
            Status = "pending",
        };

        await _prs.InsertOneAsync(submission);

        var dto = (await _mapper.ToDtosAsync(new List<PrSubmission> { submission }, CurrentUserId)).First();
        return Ok(dto);
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(string id)
    {
        var submission = await _prs.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (submission is null)
        {
            return NotFound();
        }

        bool liked = !submission.LikedByUserIds.Contains(CurrentUserId);
        var update = liked
            ? Builders<PrSubmission>.Update.AddToSet(p => p.LikedByUserIds, CurrentUserId)
            : Builders<PrSubmission>.Update.Pull(p => p.LikedByUserIds, CurrentUserId);

        await _prs.UpdateOneAsync(p => p.Id == id, update);

        var likeCount = liked
            ? submission.LikedByUserIds.Count + 1
            : submission.LikedByUserIds.Count - 1;

        if (liked && submission.UserId != CurrentUserId)
        {
            var actor = await _users.Find(u => u.Id == CurrentUserId).FirstOrDefaultAsync();
            var actorName = actor is null ? "Unknown" : $"{actor.FirstName} {actor.LastName}";
            await _notifications.NotifyAsync(
                submission.UserId,
                "like",
                $"{actorName} liked your {submission.LiftType} PR",
                $"/prs/{submission.Id}",
                CurrentUserId,
                actorName);
        }

        return Ok(new { liked, likeCount });
    }

    // Paginated by root (top-level) comment — each page also includes every
    // reply under the root comments it returns, so a page is never missing a
    // thread's replies. `skip`/`limit` count roots only; a caller checking
    // for more pages should count roots in the response, not raw item count.
    [HttpGet("{id}/comments")]
    public async Task<ActionResult<List<CommentDto>>> GetComments(
        string id, [FromQuery] int skip = 0, [FromQuery] int limit = Paging.DefaultLimit)
    {
        var rootIds = await _comments
            .Find(c => c.PrSubmissionId == id && c.ParentCommentId == null)
            .SortBy(c => c.CreatedAt)
            .Skip(Paging.ClampSkip(skip))
            .Limit(Paging.ClampLimit(limit))
            .Project(c => c.Id!)
            .ToListAsync();

        if (rootIds.Count == 0)
        {
            return Ok(new List<CommentDto>());
        }

        var filter = Builders<Comment>.Filter.And(
            Builders<Comment>.Filter.Eq(c => c.PrSubmissionId, id),
            Builders<Comment>.Filter.Or(
                Builders<Comment>.Filter.In(c => c.Id, rootIds),
                Builders<Comment>.Filter.In(c => c.ParentCommentId, rootIds)));

        var comments = await _comments.Find(filter).SortBy(c => c.CreatedAt).ToListAsync();

        var userIds = comments.Select(c => c.UserId).Distinct().ToList();
        var users = await _users.Find(u => userIds.Contains(u.Id!)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id!, u => $"{u.FirstName} {u.LastName}");

        return Ok(comments.Select(c => new CommentDto
        {
            Id = c.Id!,
            UserId = c.UserId,
            UserFullName = userMap.GetValueOrDefault(c.UserId, "Unknown"),
            Text = c.Text,
            CreatedAt = c.CreatedAt,
            ParentCommentId = c.ParentCommentId,
        }));
    }

    // Where a comment sits among top-level comments, so a client can load
    // exactly enough pages (skip=0, limit=position+1) to have it rendered
    // before scrolling to it — e.g. when arriving from a notification.
    [HttpGet("{id}/comments/{commentId}/locate")]
    public async Task<IActionResult> LocateComment(string id, string commentId)
    {
        var comment = await _comments.Find(c => c.Id == commentId && c.PrSubmissionId == id)
            .FirstOrDefaultAsync();
        if (comment is null)
        {
            return NotFound();
        }

        var rootComment = comment.ParentCommentId is null
            ? comment
            : await _comments.Find(c => c.Id == comment.ParentCommentId).FirstOrDefaultAsync() ?? comment;

        var position = await _comments.CountDocumentsAsync(c =>
            c.PrSubmissionId == id && c.ParentCommentId == null && c.CreatedAt < rootComment.CreatedAt);

        return Ok(new { rootCommentId = rootComment.Id, position = (int)position });
    }

    [HttpPost("{id}/comments")]
    public async Task<ActionResult<CommentDto>> AddComment(string id, CreateCommentRequest request)
    {
        var submission = await _prs.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (submission is null)
        {
            return NotFound();
        }

        string? parentCommentId = null;
        if (!string.IsNullOrEmpty(request.ParentCommentId))
        {
            var parent = await _comments.Find(c => c.Id == request.ParentCommentId && c.PrSubmissionId == id)
                .FirstOrDefaultAsync();
            if (parent is null)
            {
                return BadRequest(new { message = "The comment being replied to no longer exists." });
            }

            // Flatten replies-to-replies onto the original top-level comment (Instagram-style).
            parentCommentId = parent.ParentCommentId ?? parent.Id;
        }

        var comment = new Comment
        {
            PrSubmissionId = id,
            UserId = CurrentUserId,
            ParentCommentId = parentCommentId,
            Text = request.Text.Trim(),
        };
        await _comments.InsertOneAsync(comment);

        var user = await _users.Find(u => u.Id == CurrentUserId).FirstOrDefaultAsync();
        var actorName = user is null ? "Unknown" : $"{user.FirstName} {user.LastName}";

        var commentLink = $"/prs/{submission.Id}?commentId={comment.Id}";

        if (submission.UserId != CurrentUserId)
        {
            await _notifications.NotifyAsync(
                submission.UserId,
                "comment",
                $"{actorName} commented on your {submission.LiftType} PR",
                commentLink,
                CurrentUserId,
                actorName);
        }

        var mentionedUserIds = ExtractMentionedUserIds(comment.Text)
            .Where(uid => uid != CurrentUserId && uid != submission.UserId);
        foreach (var mentionedUserId in mentionedUserIds)
        {
            await _notifications.NotifyAsync(
                mentionedUserId,
                "mention",
                $"{actorName} mentioned you in a comment",
                commentLink,
                CurrentUserId,
                actorName);
        }

        return Ok(new CommentDto
        {
            Id = comment.Id!,
            UserId = comment.UserId,
            UserFullName = actorName,
            Text = comment.Text,
            CreatedAt = comment.CreatedAt,
            ParentCommentId = comment.ParentCommentId,
        });
    }

    private static IEnumerable<string> ExtractMentionedUserIds(string text) =>
        System.Text.RegularExpressions.Regex
            .Matches(text, @"@\[[^\]]+\]\(([a-f0-9]{24})\)")
            .Select(m => m.Groups[1].Value)
            .Distinct();

    [HttpDelete("{id}/comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(string id, string commentId)
    {
        var comment = await _comments.Find(c => c.Id == commentId && c.PrSubmissionId == id)
            .FirstOrDefaultAsync();
        if (comment is null)
        {
            return NotFound();
        }

        if (comment.UserId != CurrentUserId && !User.IsInRole("admin"))
        {
            return Forbid();
        }

        // Root comments take their replies down with them.
        var idsToDelete = new List<string> { commentId };
        if (comment.ParentCommentId is null)
        {
            var replyIds = await _comments.Find(c => c.ParentCommentId == commentId)
                .Project(c => c.Id!)
                .ToListAsync();
            idsToDelete.AddRange(replyIds);
        }

        await _comments.DeleteManyAsync(c => idsToDelete.Contains(c.Id!));

        return Ok(new { deletedCommentIds = idsToDelete });
    }

    private string CurrentUserId =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing user id claim.");
}
