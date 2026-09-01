using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/leaderboard")]
[Authorize]
public class LeaderboardController : ControllerBase
{
    private readonly IMongoCollection<User> _users;
    private readonly IMongoCollection<PrSubmission> _prs;

    public LeaderboardController(IMongoDatabase database)
    {
        _users = database.GetCollection<User>("users");
        _prs = database.GetCollection<PrSubmission>("prSubmissions");
    }

    [HttpGet]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> Get()
    {
        var approved = await _prs.Find(p => p.Status == "approved").ToListAsync();
        if (approved.Count == 0)
        {
            return Ok(new List<LeaderboardEntryDto>());
        }

        var bestByUserAndLift = approved
            .GroupBy(p => (p.UserId, p.LiftType))
            .ToDictionary(g => g.Key, g => g.Max(p => p.WeightKg));

        var userIds = approved.Select(p => p.UserId).Distinct().ToList();
        var users = await _users.Find(u => userIds.Contains(u.Id!)).ToListAsync();

        var entries = users
            .Select(u =>
            {
                var squat = bestByUserAndLift.GetValueOrDefault((u.Id!, "squat"), 0);
                var bench = bestByUserAndLift.GetValueOrDefault((u.Id!, "bench"), 0);
                var deadlift = bestByUserAndLift.GetValueOrDefault((u.Id!, "deadlift"), 0);

                return new LeaderboardEntryDto
                {
                    UserId = u.Id!,
                    FullName = $"{u.FirstName} {u.LastName}",
                    ProfilePictureUrl = u.ProfilePicturePath,
                    Sex = u.Sex,
                    Age = AgeCalculator.Calculate(u.DateOfBirth),
                    BodyWeightKg = u.BodyWeightKg,
                    WeightClass = WeightClassCalculator.Calculate(u.Sex, u.BodyWeightKg),
                    HeightCm = u.HeightCm,
                    SquatKg = squat,
                    BenchKg = bench,
                    DeadliftKg = deadlift,
                    TotalKg = squat + bench + deadlift,
                };
            })
            .OrderByDescending(e => e.TotalKg)
            .ToList();

        return Ok(entries);
    }
}
