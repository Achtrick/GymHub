import { apiClient } from "./apiClient";

export type NotificationType =
  | "comment"
  | "like"
  | "mention"
  | "pr_status"
  | "weight_status"
  | "order_status";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  link: string;
  actorUserId: string | null;
  actorFullName: string | null;
  createdAt: string;
  isRead: boolean;
}

export async function getNotifications(skip = 0, limit = 20): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>("/notifications", {
    params: { skip, limit },
  });
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}
