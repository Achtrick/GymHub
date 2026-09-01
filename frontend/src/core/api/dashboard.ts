import { apiClient } from "./apiClient";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface DashboardMetrics {
  totalUsers: number;
  newUsersLast30Days: number;
  totalPrSubmissions: number;
  pendingPrSubmissions: number;
  approvedPrSubmissions: number;
  pendingWeightEntries: number;
  totalOrders: number;
  ordersReceived: number;
  ordersInShipping: number;
  ordersShipped: number;
  totalRevenueEur: number;
  userGrowth: TrendPoint[];
  revenueTrend: TrendPoint[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await apiClient.get<DashboardMetrics>("/admin/dashboard/metrics");
  return data;
}
