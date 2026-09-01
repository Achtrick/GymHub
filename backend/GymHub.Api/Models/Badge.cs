using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class Badge
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    // "squat" | "bench" | "deadlift"
    public string LiftType { get; set; } = string.Empty;

    // "bronze" | "silver" | "gold" | "platinum"
    public string Tier { get; set; } = string.Empty;

    public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;

    // A recorded request only — there is no real fulfillment/shipping pipeline.
    public bool CardOrdered { get; set; }

    public DateTime? CardOrderedAt { get; set; }

    public string? ShippingAddress { get; set; }

    public string? ShippingPhoneNumber { get; set; }

    // Price at the moment of ordering, frozen even if admin changes pricing later.
    public double? OrderPriceEur { get; set; }

    // "received" | "in_shipping" | "shipped" — only meaningful once CardOrdered.
    public string OrderStatus { get; set; } = "received";
}
