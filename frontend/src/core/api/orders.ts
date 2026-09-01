import { apiClient } from "./apiClient";
import type { BadgeTier, OrderStatus } from "./badges";
import type { LiftType } from "./prs";

export type { OrderStatus };

export interface Order {
  id: string;
  userId: string;
  userFullName: string;
  liftType: LiftType;
  tier: BadgeTier;
  priceEur: number;
  shippingAddress: string;
  shippingPhoneNumber: string;
  orderedAt: string;
  status: OrderStatus;
}

export async function getOrders(skip = 0, limit = 12): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>("/admin/orders", {
    params: { skip, limit },
  });
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/admin/orders/${id}/status`, { status });
  return data;
}
