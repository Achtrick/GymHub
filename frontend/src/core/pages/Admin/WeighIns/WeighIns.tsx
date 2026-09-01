import { useRef, useState } from "react";
import { mediaUrl } from "../../../api/apiClient";
import {
  getPendingWeightEntries,
  updateWeightEntryStatus,
  type WeightEntry,
} from "../../../api/weightEntries";
import { useInfiniteList } from "../../../hooks/useInfiniteList";
import { useScrollLoadMore } from "../../../hooks/useScrollLoadMore";
import styles from "./WeighIns.module.scss";

function WeighIns() {
  const pageRef = useRef<HTMLDivElement>(null);
  const {
    items,
    hasMore,
    isLoadingMore,
    error,
    loadMore,
    mutate,
  } = useInfiniteList<WeightEntry>({
    fetchPage: (skip, limit) => getPendingWeightEntries("pending", skip, limit),
  });
  useScrollLoadMore(pageRef, loadMore, hasMore && !isLoadingMore);

  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      await updateWeightEntryStatus(id, status);
      mutate((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page} ref={pageRef}>
      <h1>Pending weigh-ins</h1>
      <p className={styles.subtitle}>
        Verify bodyweight photos before they update a user's leaderboard weight class.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {!items && !error && <p className={styles.hint}>Loading…</p>}
      {items?.length === 0 && <p className={styles.hint}>Nothing pending review.</p>}

      <div className={styles.grid}>
        {items?.map((item) => (
          <div className={styles.card} key={item.id}>
            <img className={styles.photo} src={mediaUrl(item.photoUrl)} alt="Weigh-in verification" />
            <div className={styles.body}>
              <span className={styles.lifter}>{item.userFullName}</span>
              <span className={styles.weightBadge}>{item.bodyWeightKg}kg</span>
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

export default WeighIns;
