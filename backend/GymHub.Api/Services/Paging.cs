public static class Paging
{
    public const int DefaultLimit = 12;
    public const int MaxLimit = 50;

    public static int ClampLimit(int limit) =>
        Math.Clamp(limit <= 0 ? DefaultLimit : limit, 1, MaxLimit);

    public static int ClampSkip(int skip) => Math.Max(0, skip);
}
