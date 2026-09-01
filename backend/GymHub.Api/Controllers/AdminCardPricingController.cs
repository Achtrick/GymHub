using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

[ApiController]
[Route("api/admin/card-pricing")]
[Authorize(Roles = "admin")]
public class AdminCardPricingController : ControllerBase
{
    private readonly IMongoCollection<CardPricingSettings> _pricing;
    private readonly CardPricingService _pricingService;

    public AdminCardPricingController(IMongoDatabase database, CardPricingService pricingService)
    {
        _pricing = database.GetCollection<CardPricingSettings>("cardPricing");
        _pricingService = pricingService;
    }

    [HttpGet]
    public async Task<ActionResult<CardPricingDto>> Get()
    {
        var settings = await _pricingService.GetOrCreateAsync();
        return Ok(CardPricingDto.FromSettings(settings));
    }

    [HttpPut]
    public async Task<ActionResult<CardPricingDto>> Update(UpdateCardPricingRequest request)
    {
        var settings = await _pricingService.GetOrCreateAsync();

        var update = Builders<CardPricingSettings>.Update
            .Set(s => s.BronzePriceEur, request.Bronze)
            .Set(s => s.SilverPriceEur, request.Silver)
            .Set(s => s.GoldPriceEur, request.Gold)
            .Set(s => s.PlatinumPriceEur, request.Platinum);

        var updated = await _pricing.FindOneAndUpdateAsync(
            s => s.Id == settings.Id,
            update,
            new FindOneAndUpdateOptions<CardPricingSettings> { ReturnDocument = ReturnDocument.After });

        return Ok(CardPricingDto.FromSettings(updated));
    }
}
