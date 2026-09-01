public static class OrderStatuses
{
    public static readonly string[] All = { "received", "in_shipping", "shipped" };

    public static bool IsValid(string? status) => status is not null && All.Contains(status);
}
