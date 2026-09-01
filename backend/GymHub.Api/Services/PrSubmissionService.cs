using MongoDB.Driver;

public class PrSubmissionService
{
    private readonly IMongoCollection<User> _users;
    private readonly IMongoCollection<Comment> _comments;

    public PrSubmissionService(IMongoDatabase database)
    {
        _users = database.GetCollection<User>("users");
        _comments = database.GetCollection<Comment>("comments");
    }

    public async Task<List<PrSubmissionDto>> ToDtosAsync(
        List<PrSubmission> submissions,
        string? currentUserId)
    {
        if (submissions.Count == 0)
        {
            return new List<PrSubmissionDto>();
        }

        var userIds = submissions.Select(s => s.UserId).Distinct().ToList();
        var users = await _users.Find(u => userIds.Contains(u.Id!)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id!, u => u);

        var prIds = submissions.Select(s => s.Id!).ToList();
        var comments = await _comments.Find(c => prIds.Contains(c.PrSubmissionId)).ToListAsync();
        var commentCountMap = comments
            .GroupBy(c => c.PrSubmissionId)
            .ToDictionary(g => g.Key, g => g.Count());

        return submissions.Select(s =>
        {
            userMap.TryGetValue(s.UserId, out var user);
            return new PrSubmissionDto
            {
                Id = s.Id!,
                UserId = s.UserId,
                UserFullName = user is null ? "Unknown" : $"{user.FirstName} {user.LastName}",
                UserProfilePictureUrl = user?.ProfilePicturePath,
                LiftType = s.LiftType,
                WeightKg = s.WeightKg,
                VideoUrl = s.VideoPath,
                Status = s.Status,
                CreatedAt = s.CreatedAt,
                LikeCount = s.LikedByUserIds.Count,
                LikedByMe = currentUserId is not null && s.LikedByUserIds.Contains(currentUserId),
                CommentCount = commentCountMap.GetValueOrDefault(s.Id!, 0),
            };
        }).ToList();
    }
}
