public class LeaderboardEntryDto
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? Sex { get; set; }
    public int? Age { get; set; }
    public double? BodyWeightKg { get; set; }
    public string? WeightClass { get; set; }
    public double? HeightCm { get; set; }
    public double SquatKg { get; set; }
    public double BenchKg { get; set; }
    public double DeadliftKg { get; set; }
    public double TotalKg { get; set; }
}
