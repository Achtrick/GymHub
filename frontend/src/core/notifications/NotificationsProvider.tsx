import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "../api/notifications";
import { useAuth } from "../auth/useAuth";
import { NotificationsContext, type NotificationsContextValue } from "./notifications-context";

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 15_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const notificationsRef = useRef<Notification[]>([]);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setIsLoadingMore(true);
    try {
      const skip = notificationsRef.current.length;
      const page = await getNotifications(skip, PAGE_SIZE);
      notificationsRef.current = [...notificationsRef.current, ...page];
      setNotifications([...notificationsRef.current]);
      if (page.length < PAGE_SIZE) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch {
      // no-op
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  // Polls the first page and merges in anything not already loaded, so newly
  // arrived notifications appear at the top without disturbing already-loaded
  // older pages or local read-state. Skipped while the tab is hidden.
  const pollLatest = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const [freshFirstPage, count] = await Promise.all([
        getNotifications(0, PAGE_SIZE),
        getUnreadNotificationCount(),
      ]);
      const existingIds = new Set(notificationsRef.current.map((n) => n.id));
      const newOnes = freshFirstPage.filter((n) => !existingIds.has(n.id));
      if (newOnes.length > 0) {
        notificationsRef.current = [...newOnes, ...notificationsRef.current];
        setNotifications([...notificationsRef.current]);
      }
      setUnreadCount(count);
    } catch {
      // no-op — try again on the next tick
    }
  }, []);

  const userId = user?.id;

  // Reset and (re)load whenever the logged-in user changes (including logout).
  useEffect(() => {
    notificationsRef.current = [];
    hasMoreRef.current = true;
    loadingRef.current = false;

    void Promise.resolve().then(() => {
      setNotifications([]);
      setHasMore(true);
      setUnreadCount(0);
    });

    if (!userId) return;

    void loadMore();
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Timed polling for new notifications — separate effect so a poll tick
  // doesn't reset already-loaded pages.
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => void pollLatest(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, pollLatest]);

  const markRead = useCallback((id: string) => {
    const target = notificationsRef.current.find((n) => n.id === id);
    if (!target || target.isRead) return;

    notificationsRef.current = notificationsRef.current.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    setNotifications([...notificationsRef.current]);
    setUnreadCount((count) => Math.max(0, count - 1));
    markNotificationRead(id).catch(() => null);
  }, []);

  const markAllRead = useCallback(() => {
    notificationsRef.current = notificationsRef.current.map((n) => ({ ...n, isRead: true }));
    setNotifications([...notificationsRef.current]);
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => null);
  }, []);

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    hasMore,
    isLoadingMore,
    loadMore,
    markRead,
    markAllRead,
  };

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}
