using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

// Singleton document — one row, admin-editable, price per badge tier in EUR.
public class CardPricingSettings
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public double BronzePriceEur { get; set; } = 20;
    public double SilverPriceEur { get; set; } = 20;
    public double GoldPriceEur { get; set; } = 20;
    public double PlatinumPriceEur { get; set; } = 20;
}
