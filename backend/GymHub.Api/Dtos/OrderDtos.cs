using System.ComponentModel.DataAnnotations;

public class OrderDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string LiftType { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public double PriceEur { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string ShippingPhoneNumber { get; set; } = string.Empty;
    public DateTime OrderedAt { get; set; }
    public string Status { get; set; } = string.Empty;

    public static OrderDto FromBadge(Badge badge, string userFullName) => new()
    {
        Id = badge.Id!,
        UserId = badge.UserId,
        UserFullName = userFullName,
        LiftType = badge.LiftType,
        Tier = badge.Tier,
        PriceEur = badge.OrderPriceEur ?? 0,
        ShippingAddress = badge.ShippingAddress ?? string.Empty,
        ShippingPhoneNumber = badge.ShippingPhoneNumber ?? string.Empty,
        OrderedAt = badge.CardOrderedAt ?? badge.ClaimedAt,
        Status = badge.OrderStatus,
    };
}

public class UpdateOrderStatusRequest
{
    [Required, RegularExpression("^(received|in_shipping|shipped)$")]
    public string Status { get; set; } = string.Empty;
}
