public record BadgeThreshold(string Tier, double PlatesPerSide, double WeightKg);

public static class BadgeTiers
{
    // Standard Olympic bar + plates, both 20kg — matches the plate imagery on
    // the badge cards. Total = bar + (plates per side * 2 * plate weight).
    private const double BarWeightKg = 20;
    private const double PlateWeightKg = 20;

    public static readonly string[] TierOrder = { "bronze", "silver", "gold", "platinum" };

    public static readonly IReadOnlyDictionary<string, List<BadgeThreshold>> ThresholdsByLift =
        new Dictionary<string, List<BadgeThreshold>>
        {
            ["bench"] = BuildTiers(1, 2, 3, 4),
            ["squat"] = BuildTiers(2, 3, 4, 5),
            ["deadlift"] = BuildTiers(2, 3, 4, 5),
        };

    private static List<BadgeThreshold> BuildTiers(
        double bronze, double silver, double gold, double platinum) =>
        new()
        {
            new BadgeThreshold("bronze", bronze, Weight(bronze)),
            new BadgeThreshold("silver", silver, Weight(silver)),
            new BadgeThreshold("gold", gold, Weight(gold)),
            new BadgeThreshold("platinum", platinum, Weight(platinum)),
        };

    private static double Weight(double platesPerSide) =>
        BarWeightKg + (2 * platesPerSide * PlateWeightKg);
}
