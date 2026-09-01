import { createContext } from "react";
import type { Notification } from "../api/notifications";

export interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined,
);
