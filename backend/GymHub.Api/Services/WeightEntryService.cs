using MongoDB.Driver;

public class WeightEntryService
{
    private readonly IMongoCollection<User> _users;

    public WeightEntryService(IMongoDatabase database)
    {
        _users = database.GetCollection<User>("users");
    }

    public async Task<List<WeightEntryDto>> ToDtosAsync(List<WeightEntry> entries)
    {
        if (entries.Count == 0)
        {
            return new List<WeightEntryDto>();
        }

        var userIds = entries.Select(e => e.UserId).Distinct().ToList();
        var users = await _users.Find(u => userIds.Contains(u.Id!)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id!, u => u);

        return entries.Select(e =>
        {
            userMap.TryGetValue(e.UserId, out var user);
            return new WeightEntryDto
            {
                Id = e.Id!,
                UserId = e.UserId,
                UserFullName = user is null ? "Unknown" : $"{user.FirstName} {user.LastName}",
                BodyWeightKg = e.BodyWeightKg,
                PhotoUrl = e.PhotoPath,
                Status = e.Status,
                CreatedAt = e.CreatedAt,
            };
        }).ToList();
    }
}
