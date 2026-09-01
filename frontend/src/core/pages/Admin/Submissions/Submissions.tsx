import { useRef, useState } from "react";
import { mediaUrl } from "../../../api/apiClient";
import {
  getPendingSubmissions,
  updateSubmissionStatus,
  type PrSubmission,
} from "../../../api/prs";
import { useInfiniteList } from "../../../hooks/useInfiniteList";
import { useScrollLoadMore } from "../../../hooks/useScrollLoadMore";
import styles from "./Submissions.module.scss";

const LIFT_LABELS: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
};

function Submissions() {
  const pageRef = useRef<HTMLDivElement>(null);
  const {
    items,
    hasMore,
    isLoadingMore,
    error,
    loadMore,
    mutate,
  } = useInfiniteList<PrSubmission>({
    fetchPage: (skip, limit) => getPendingSubmissions("pending", skip, limit),
  });
  useScrollLoadMore(pageRef, loadMore, hasMore && !isLoadingMore);

  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      await updateSubmissionStatus(id, status);
      mutate((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page} ref={pageRef}>
      <h1>Pending submissions</h1>
      <p className={styles.subtitle}>
        Review lift videos before they appear in the feed and leaderboard.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {!items && !error && <p className={styles.hint}>Loading…</p>}
      {items?.length === 0 && <p className={styles.hint}>Nothing pending review.</p>}

      <div className={styles.grid}>
        {items?.map((item) => (
          <div className={styles.card} key={item.id}>
            <video
              className={styles.video}
              src={mediaUrl(item.videoUrl)}
              controls
              preload="metadata"
            />
            <div className={styles.body}>
              <span className={styles.lifter}>{item.userFullName}</span>
              <span className={styles.liftBadge}>
                {LIFT_LABELS[item.liftType] ?? item.liftType} · {item.weightKg}kg
              </span>
              <div className={styles.actions}>
                <button
                  className={styles.approve}
                  disabled={busyId === item.id}
                  onClick={() => handleDecision(item.id, "approved")}
                >
                  Approve
                </button>
                <button
                  className={styles.reject}
                  disabled={busyId === item.id}
                  onClick={() => handleDecision(item.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoadingMore && <p className={styles.hint}>Loading more…</p>}
    </div>
  );
}

export default Submissions;
