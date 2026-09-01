public class PublicProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? Sex { get; set; }
    public int? Age { get; set; }
    public double? HeightCm { get; set; }
    public double? BodyWeightKg { get; set; }
    public string? WeightClass { get; set; }

    public static PublicProfileDto FromUser(User user) => new()
    {
        Id = user.Id!,
        FullName = $"{user.FirstName} {user.LastName}",
        ProfilePictureUrl = user.ProfilePicturePath,
        Sex = user.Sex,
        Age = AgeCalculator.Calculate(user.DateOfBirth),
        HeightCm = user.HeightCm,
        BodyWeightKg = user.BodyWeightKg,
        WeightClass = WeightClassCalculator.Calculate(user.Sex, user.BodyWeightKg),
    };
}
