using System.ComponentModel.DataAnnotations;

public class ClaimBadgeRequest
{
    [Required]
    public string LiftType { get; set; } = string.Empty;

    [Required]
    public string Tier { get; set; } = string.Empty;
}

public class CreateCheckoutSessionRequest
{
    [Required]
    public string Address { get; set; } = string.Empty;

    [Required]
    public string PhoneNumber { get; set; } = string.Empty;

    // The page to return to after Stripe Checkout (success or cancel) — e.g.
    // the profile page the user was on. Query params are appended to it.
    [Required]
    public string ReturnUrl { get; set; } = string.Empty;
}

public class CardPricingDto
{
    public double Bronze { get; set; }
    public double Silver { get; set; }
    public double Gold { get; set; }
    public double Platinum { get; set; }

    public static CardPricingDto FromSettings(CardPricingSettings settings) => new()
    {
        Bronze = settings.BronzePriceEur,
        Silver = settings.SilverPriceEur,
        Gold = settings.GoldPriceEur,
        Platinum = settings.PlatinumPriceEur,
    };
}

public class UpdateCardPricingRequest
{
    [Required, Range(0, 10000)]
    public double Bronze { get; set; }

    [Required, Range(0, 10000)]
    public double Silver { get; set; }

    [Required, Range(0, 10000)]
    public double Gold { get; set; }

    [Required, Range(0, 10000)]
    public double Platinum { get; set; }
}

public class BadgeDto
{
    public string? Id { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string LiftType { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public double PlatesPerSide { get; set; }
    public double WeightKg { get; set; }
    public bool Eligible { get; set; }
    public bool Claimed { get; set; }
    public DateTime? ClaimedAt { get; set; }
    public bool CardOrdered { get; set; }
    public double PriceEur { get; set; }
    public string? OrderStatus { get; set; }
}
