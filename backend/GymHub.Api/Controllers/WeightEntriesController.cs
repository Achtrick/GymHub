using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/weight-entries")]
[Authorize]
public class WeightEntriesController : ControllerBase
{
    private const long MaxPhotoBytes = 15_000_000; // 15 MB

    private readonly IMongoCollection<WeightEntry> _weightEntries;
    private readonly WeightEntryService _mapper;
    private readonly UploadSettings _uploadSettings;

    public WeightEntriesController(
        IMongoDatabase database,
        WeightEntryService mapper,
        UploadSettings uploadSettings)
    {
        _weightEntries = database.GetCollection<WeightEntry>("weightEntries");
        _mapper = mapper;
        _uploadSettings = uploadSettings;
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<WeightEntryDto>>> Mine()
    {
        var entries = await _weightEntries.Find(e => e.UserId == CurrentUserId)
            .SortByDescending(e => e.CreatedAt)
            .ToListAsync();

        return Ok(await _mapper.ToDtosAsync(entries));
    }

    // Approved weigh-ins for a user's public profile — chronological, for
    // plotting bodyweight progression.
    [HttpGet("by-user/{userId}")]
    public async Task<ActionResult<List<WeightEntryDto>>> ByUser(string userId)
    {
        var entries = await _weightEntries.Find(e => e.UserId == userId && e.Status == "approved")
            .SortBy(e => e.CreatedAt)
            .ToListAsync();

        return Ok(await _mapper.ToDtosAsync(entries));
    }

    [HttpPost]
    [RequestSizeLimit(MaxPhotoBytes)]
    public async Task<ActionResult<WeightEntryDto>> Create([FromForm] SubmitWeightEntryRequest request)
    {
        if (request.Photo.Length == 0)
        {
            return BadRequest(new { message = "A verification photo is required." });
        }

        if (!request.Photo.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "The uploaded file must be a photo." });
        }

        Directory.CreateDirectory(_uploadSettings.Directory);

        var extension = Path.GetExtension(request.Photo.FileName);
        var fileName = $"{Guid.NewGuid():N}{(string.IsNullOrWhiteSpace(extension) ? ".jpg" : extension)}";
        var filePath = Path.Combine(_uploadSettings.Directory, fileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await request.Photo.CopyToAsync(stream);
        }

        var entry = new WeightEntry
        {
            UserId = CurrentUserId,
            BodyWeightKg = request.BodyWeightKg,
            PhotoPath = $"/uploads/{fileName}",
            Status = "pending",
        };

        await _weightEntries.InsertOneAsync(entry);

        var dto = (await _mapper.ToDtosAsync(new List<WeightEntry> { entry })).First();
        return Ok(dto);
    }

    private string CurrentUserId =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing user id claim.");
}
