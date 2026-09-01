import { apiClient } from "./apiClient";
import type { LiftType } from "./prs";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";
export type OrderStatus = "received" | "in_shipping" | "shipped";

export interface Badge {
  id: string | null;
  userFullName: string;
  liftType: LiftType;
  tier: BadgeTier;
  platesPerSide: number;
  weightKg: number;
  eligible: boolean;
  claimed: boolean;
  claimedAt: string | null;
  cardOrdered: boolean;
  priceEur: number;
  orderStatus: OrderStatus | null;
}

export interface CardPricing {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

export async function getMyBadges(): Promise<Badge[]> {
  const { data } = await apiClient.get<Badge[]>("/badges/mine");
  return data;
}

export async function getBadgesByUser(userId: string): Promise<Badge[]> {
  const { data } = await apiClient.get<Badge[]>(`/badges/by-user/${userId}`);
  return data;
}

export async function claimBadge(liftType: LiftType, tier: BadgeTier): Promise<Badge> {
  const { data } = await apiClient.post<Badge>("/badges/claim", { liftType, tier });
  return data;
}

export async function createCheckoutSession(
  id: string,
  address: string,
  phoneNumber: string,
  returnUrl: string,
): Promise<{ url: string }> {
  const { data } = await apiClient.post<{ url: string }>(`/badges/${id}/checkout-session`, {
    address,
    phoneNumber,
    returnUrl,
  });
  return data;
}

export async function confirmCheckoutSession(sessionId: string): Promise<Badge> {
  const { data } = await apiClient.get<Badge>(`/badges/checkout-session/${sessionId}/confirm`);
  return data;
}

export async function getCardPricing(): Promise<CardPricing> {
  const { data } = await apiClient.get<CardPricing>("/admin/card-pricing");
  return data;
}

export async function updateCardPricing(pricing: CardPricing): Promise<CardPricing> {
  const { data } = await apiClient.put<CardPricing>("/admin/card-pricing", pricing);
  return data;
}
