public static class WeightClassCalculator
{
    private static readonly double[] MenClassesKg = { 59, 66, 74, 83, 93, 105, 120 };
    private static readonly double[] WomenClassesKg = { 47, 52, 57, 63, 69, 76, 84 };

    // IPF-style bodyweight classes. Returns null when sex or bodyweight is unknown.
    public static string? Calculate(string? sex, double? bodyWeightKg)
    {
        if (sex is null || bodyWeightKg is null)
        {
            return null;
        }

        var classes = sex == "female" ? WomenClassesKg : MenClassesKg;

        foreach (var classMax in classes)
        {
            if (bodyWeightKg <= classMax)
            {
                return $"-{classMax:0.#}kg";
            }
        }

        return $"{classes[^1]:0.#}kg+";
    }
}
