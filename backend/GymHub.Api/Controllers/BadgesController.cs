using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Stripe;
using Stripe.Checkout;

[ApiController]
[Route("api/badges")]
[Authorize]
public class BadgesController : ControllerBase
{
    private readonly IMongoCollection<Badge> _badges;
    private readonly IMongoCollection<PrSubmission> _prs;
    private readonly IMongoCollection<User> _users;
    private readonly CardPricingService _pricing;

    public BadgesController(IMongoDatabase database, CardPricingService pricing)
    {
        _badges = database.GetCollection<Badge>("badges");
        _prs = database.GetCollection<PrSubmission>("prSubmissions");
        _users = database.GetCollection<User>("users");
        _pricing = pricing;
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<BadgeDto>>> Mine()
    {
        var dtos = await BuildBadgeListAsync(CurrentUserId);
        return Ok(dtos);
    }

    [HttpGet("by-user/{userId}")]
    public async Task<ActionResult<List<BadgeDto>>> ByUser(string userId)
    {
        var dtos = await BuildBadgeListAsync(userId);
        return Ok(dtos.Where(d => d.Claimed).ToList());
    }

    [HttpPost("claim")]
    public async Task<ActionResult<BadgeDto>> Claim(ClaimBadgeRequest request)
    {
        if (!BadgeTiers.ThresholdsByLift.TryGetValue(request.LiftType, out var tiers))
        {
            return BadRequest(new { message = "Invalid lift type." });
        }

        var threshold = tiers.FirstOrDefault(t => t.Tier == request.Tier);
        if (threshold is null)
        {
            return BadRequest(new { message = "Invalid tier." });
        }

        var bestWeight = await _prs
            .Find(p => p.UserId == CurrentUserId && p.LiftType == request.LiftType && p.Status == "approved")
            .SortByDescending(p => p.WeightKg)
            .Project(p => p.WeightKg)
            .FirstOrDefaultAsync();

        if (bestWeight < threshold.WeightKg)
        {
            return BadRequest(new { message = $"You need an approved {request.LiftType} of at least {threshold.WeightKg}kg to claim this badge." });
        }

        var existing = await _badges
            .Find(b => b.UserId == CurrentUserId && b.LiftType == request.LiftType && b.Tier == request.Tier)
            .FirstOrDefaultAsync();

        if (existing is null)
        {
            existing = new Badge
            {
                UserId = CurrentUserId,
                LiftType = request.LiftType,
                Tier = request.Tier,
            };
            await _badges.InsertOneAsync(existing);
        }

        var fullName = await GetFullNameAsync(CurrentUserId);
        var pricing = await _pricing.GetOrCreateAsync();
        return Ok(ToDto(existing, request.LiftType, threshold, fullName, bestWeight, pricing));
    }

    // Step 1 of ordering a physical card: validate the badge, price it, stash
    // the shipping details in the Checkout Session's metadata (not on the
    // Badge yet — nothing is "ordered" until Stripe confirms payment), and
    // hand back the hosted Checkout URL for the frontend to redirect to.
    [HttpPost("{id}/checkout-session")]
    public async Task<ActionResult<object>> CreateCheckoutSession(string id, CreateCheckoutSessionRequest request)
    {
        var badge = await _badges.Find(b => b.Id == id && b.UserId == CurrentUserId).FirstOrDefaultAsync();
        if (badge is null)
        {
            return NotFound();
        }

        if (badge.CardOrdered)
        {
            return BadRequest(new { message = "This card has already been ordered." });
        }

        var pricing = await _pricing.GetOrCreateAsync();
        var price = CardPricingService.PriceForTier(pricing, badge.Tier);
        var separator = request.ReturnUrl.Contains('?') ? "&" : "?";

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            ManagedPayments = new SessionManagedPaymentsOptions { Enabled = false },
            LineItems = new List<SessionLineItemOptions>
            {
                new()
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "eur",
                        UnitAmount = (long)Math.Round(price * 100),
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"GymHub {badge.Tier} card — {badge.LiftType}",
                        },
                    },
                },
            },
            SuccessUrl = $"{request.ReturnUrl}{separator}checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{request.ReturnUrl}{separator}checkout=cancelled",
            Metadata = new Dictionary<string, string>
            {
                ["badgeId"] = badge.Id!,
                ["address"] = request.Address.Trim(),
                ["phoneNumber"] = request.PhoneNumber.Trim(),
            },
        };

        var session = await new SessionService().CreateAsync(options);
        return Ok(new { url = session.Url });
    }

    // Step 2: the frontend calls this once Stripe redirects back to the
    // success URL. Confirms payment actually succeeded before recording the
    // order — a successful redirect alone isn't proof of payment.
    [HttpGet("checkout-session/{sessionId}/confirm")]
    public async Task<ActionResult<BadgeDto>> ConfirmCheckoutSession(string sessionId)
    {
        Session session;
        try
        {
            session = await new SessionService().GetAsync(sessionId);
        }
        catch (StripeException)
        {
            return BadRequest(new { message = "Invalid checkout session." });
        }

        if (session.PaymentStatus != "paid")
        {
            return BadRequest(new { message = "Payment was not completed." });
        }

        if (!session.Metadata.TryGetValue("badgeId", out var badgeId))
        {
            return BadRequest(new { message = "Checkout session is missing order details." });
        }

        var badge = await _badges.Find(b => b.Id == badgeId && b.UserId == CurrentUserId).FirstOrDefaultAsync();
        if (badge is null)
        {
            return NotFound();
        }

        if (!badge.CardOrdered)
        {
            var update = Builders<Badge>.Update
                .Set(b => b.CardOrdered, true)
                .Set(b => b.CardOrderedAt, DateTime.UtcNow)
                .Set(b => b.ShippingAddress, session.Metadata.GetValueOrDefault("address"))
                .Set(b => b.ShippingPhoneNumber, session.Metadata.GetValueOrDefault("phoneNumber"))
                .Set(b => b.OrderPriceEur, (session.AmountTotal ?? 0) / 100.0)
                .Set(b => b.OrderStatus, "received");

            badge = await _badges.FindOneAndUpdateAsync(
                b => b.Id == badgeId,
                update,
                new FindOneAndUpdateOptions<Badge> { ReturnDocument = ReturnDocument.After });
        }

        var pricing = await _pricing.GetOrCreateAsync();
        var threshold = BadgeTiers.ThresholdsByLift[badge!.LiftType].First(t => t.Tier == badge.Tier);
        var fullName = await GetFullNameAsync(CurrentUserId);
        return Ok(ToDto(badge, badge.LiftType, threshold, fullName, threshold.WeightKg, pricing));
    }

    private async Task<List<BadgeDto>> BuildBadgeListAsync(string userId)
    {
        var approved = await _prs.Find(p => p.UserId == userId && p.Status == "approved").ToListAsync();
        var bestByLift = approved
            .GroupBy(p => p.LiftType)
            .ToDictionary(g => g.Key, g => g.Max(p => p.WeightKg));

        var claimed = await _badges.Find(b => b.UserId == userId).ToListAsync();
        var claimedMap = claimed.ToDictionary(b => (b.LiftType, b.Tier));

        var fullName = await GetFullNameAsync(userId);
        var pricing = await _pricing.GetOrCreateAsync();

        var result = new List<BadgeDto>();
        foreach (var (liftType, tiers) in BadgeTiers.ThresholdsByLift)
        {
            var best = bestByLift.GetValueOrDefault(liftType, 0);
            foreach (var threshold in tiers)
            {
                claimedMap.TryGetValue((liftType, threshold.Tier), out var badge);
                result.Add(ToDto(badge, liftType, threshold, fullName, best, pricing));
            }
        }

        return result;
    }

    private static BadgeDto ToDto(
        Badge? badge,
        string liftType,
        BadgeThreshold threshold,
        string fullName,
        double bestWeight,
        CardPricingSettings pricing) => new()
    {
        Id = badge?.Id,
        UserFullName = fullName,
        LiftType = liftType,
        Tier = threshold.Tier,
        PlatesPerSide = threshold.PlatesPerSide,
        WeightKg = threshold.WeightKg,
        Eligible = bestWeight >= threshold.WeightKg,
        Claimed = badge is not null,
        ClaimedAt = badge?.ClaimedAt,
        CardOrdered = badge?.CardOrdered ?? false,
        PriceEur = CardPricingService.PriceForTier(pricing, threshold.Tier),
        OrderStatus = badge?.CardOrdered == true ? badge.OrderStatus : null,
    };

    private async Task<string> GetFullNameAsync(string userId)
    {
        var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        return user is null ? "Unknown" : $"{user.FirstName} {user.LastName}";
    }

    private string CurrentUserId =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing user id claim.");
}
