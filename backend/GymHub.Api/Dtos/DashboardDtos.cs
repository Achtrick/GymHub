public class TrendPointDto
{
    public string Label { get; set; } = string.Empty;
    public double Value { get; set; }
}

public class DashboardMetricsDto
{
    public int TotalUsers { get; set; }
    public int NewUsersLast30Days { get; set; }

    public int TotalPrSubmissions { get; set; }
    public int PendingPrSubmissions { get; set; }
    public int ApprovedPrSubmissions { get; set; }

    public int PendingWeightEntries { get; set; }

    public int TotalOrders { get; set; }
    public int OrdersReceived { get; set; }
    public int OrdersInShipping { get; set; }
    public int OrdersShipped { get; set; }
    public double TotalRevenueEur { get; set; }

    public List<TrendPointDto> UserGrowth { get; set; } = new();
    public List<TrendPointDto> RevenueTrend { get; set; } = new();
}
