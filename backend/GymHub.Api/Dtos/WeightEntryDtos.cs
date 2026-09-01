using System.ComponentModel.DataAnnotations;

public class SubmitWeightEntryRequest
{
    [Required, Range(20, 400)]
    public double BodyWeightKg { get; set; }

    [Required]
    public IFormFile Photo { get; set; } = null!;
}

public class WeightEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public double BodyWeightKg { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
