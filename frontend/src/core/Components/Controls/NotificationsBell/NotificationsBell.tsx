import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Notification } from "../../../api/notifications";
import { useNotifications } from "../../../notifications/useNotifications";
import { BellIcon } from "../Icons";
import styles from "./NotificationsBell.module.scss";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function NotificationsBell() {
  const { notifications, unreadCount, hasMore, isLoadingMore, loadMore, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (notification: Notification) => {
    if (!notification.isRead) markRead(notification.id);
    setOpen(false);

    // PR-related notifications open the post in its own tab (pinned video +
    // full scrollable comments) rather than navigating away from wherever
    // the user currently is.
    if (notification.link.startsWith("/prs/")) {
      window.open(notification.link, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(notification.link);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && !isLoadingMore && (
            <p className={styles.empty}>No notifications yet.</p>
          )}

          <div className={styles.list}>
            {notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                className={notification.isRead ? styles.item : styles.itemUnread}
                onClick={() => handleSelect(notification)}
              >
                <span className={styles.message}>{notification.message}</span>
                <span className={styles.time}>{timeAgo(notification.createdAt)}</span>
              </button>
            ))}
          </div>

          {hasMore && (
            <button
              type="button"
              className={styles.loadMore}
              disabled={isLoadingMore}
              onClick={loadMore}
            >
              {isLoadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsBell;
