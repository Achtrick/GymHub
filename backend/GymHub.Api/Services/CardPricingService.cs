using MongoDB.Driver;

public class CardPricingService
{
    private readonly IMongoCollection<CardPricingSettings> _pricing;

    public CardPricingService(IMongoDatabase database)
    {
        _pricing = database.GetCollection<CardPricingSettings>("cardPricing");
    }

    public async Task<CardPricingSettings> GetOrCreateAsync()
    {
        var settings = await _pricing.Find(FilterDefinition<CardPricingSettings>.Empty).FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new CardPricingSettings();
            await _pricing.InsertOneAsync(settings);
        }

        return settings;
    }

    public static double PriceForTier(CardPricingSettings settings, string tier) => tier switch
    {
        "bronze" => settings.BronzePriceEur,
        "silver" => settings.SilverPriceEur,
        "gold" => settings.GoldPriceEur,
        "platinum" => settings.PlatinumPriceEur,
        _ => 0,
    };
}
