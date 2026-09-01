import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { mediaUrl } from "../../api/apiClient";
import { getMyPrs, submitPr, type LiftType, type PrSubmission } from "../../api/prs";
import { useAuth } from "../../auth/useAuth";
import EditStatsModal from "../../Components/Controls/EditStatsModal/EditStatsModal";
import Modal from "../../Components/Controls/Modal/Modal";
import { PencilIcon, PlusIcon } from "../../Components/Controls/Icons";
import { useInfiniteList } from "../../hooks/useInfiniteList";
import { useScrollLoadMore } from "../../hooks/useScrollLoadMore";
import styles from "./MyPrs.module.scss";

const LIFT_LABELS: Record<LiftType, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
};

const STATUS_LABELS: Record<PrSubmission["status"], string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const FILTERS: { id: "all" | LiftType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "squat", label: "S" },
  { id: "bench", label: "B" },
  { id: "deadlift", label: "D" },
];

function MyPrs() {
  const { user } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const {
    items: prs,
    hasMore,
    isLoadingMore,
    error: loadError,
    loadMore,
    reload: reloadPrs,
  } = useInfiniteList<PrSubmission>({ fetchPage: getMyPrs });
  useScrollLoadMore(pageRef, loadMore, hasMore && !isLoadingMore);
  const [filter, setFilter] = useState<"all" | LiftType>("all");
  const [activeModal, setActiveModal] = useState<"stats" | "submit" | null>(null);
  const [toolbarHidden, setToolbarHidden] = useState(false);

  const [submitForm, setSubmitForm] = useState<{
    liftType: LiftType;
    weightKg: string;
    video: File | null;
  }>({ liftType: "squat", weightKg: "", video: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const scrollContainer = pageRef.current?.closest<HTMLElement>("[data-swipe-panel]");
    if (!scrollContainer) return;

    let lastScrollTop = scrollContainer.scrollTop;

    const handleScroll = () => {
      const current = scrollContainer.scrollTop;
      const delta = current - lastScrollTop;

      if (current <= 0) {
        setToolbarHidden(false);
      } else if (delta > 4) {
        setToolbarHidden(true);
      } else if (delta < -4) {
        setToolbarHidden(false);
      }

      lastScrollTop = current;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const visiblePrs = useMemo(
    () => prs?.filter((pr) => filter === "all" || pr.liftType === filter) ?? null,
    [prs, filter],
  );

  const handleNewPrClick = () => {
    setActiveModal(user?.sex ? "submit" : "stats");
  };

  const handleSubmitPr = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!user?.sex) {
      setSubmitError("Set your sex in Edit stats before submitting a PR.");
      return;
    }

    if (!submitForm.video) {
      setSubmitError("Please attach a video of your lift.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPr(submitForm.liftType, Number(submitForm.weightKg), submitForm.video);
      setSubmitForm({ liftType: "squat", weightKg: "", video: null });
      setActiveModal(null);
      reloadPrs();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit your PR.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page} ref={pageRef}>
      <h1 className={styles.title}>My PRs</h1>

      <div className={`${styles.toolbar} ${toolbarHidden ? styles.toolbarHidden : ""}`}>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? styles.filterActive : styles.filter}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setActiveModal("stats")}
          >
            <PencilIcon /> Edit stats
          </button>
          <button type="button" onClick={handleNewPrClick}>
            <PlusIcon /> New PR
          </button>
        </div>
      </div>

      {loadError && <p className={styles.error}>{loadError}</p>}
      {!visiblePrs && !loadError && <p className={styles.hint}>Loading…</p>}
      {visiblePrs?.length === 0 && (
        <p className={styles.hint}>
          {filter === "all"
            ? "You haven't submitted any PRs yet."
            : `No ${LIFT_LABELS[filter as LiftType]} PRs yet.`}
        </p>
      )}

      <div className={styles.grid}>
        {visiblePrs?.map((pr) => (
          <div className={styles.card} key={pr.id}>
            <video className={styles.video} src={mediaUrl(pr.videoUrl)} controls preload="metadata" />
            <div className={styles.cardBody}>
              <span className={styles.liftLabel}>
                {LIFT_LABELS[pr.liftType]} · {pr.weightKg}kg
              </span>
              <span className={`${styles.status} ${styles[pr.status]}`}>
                {STATUS_LABELS[pr.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isLoadingMore && <p className={styles.hint}>Loading more…</p>}

      {activeModal === "stats" && <EditStatsModal onClose={() => setActiveModal(null)} />}

      {activeModal === "submit" && (
        <Modal title="Submit a new PR" onClose={() => setActiveModal(null)}>
          {submitError && <p className={styles.error}>{submitError}</p>}
          <form className={styles.form} onSubmit={handleSubmitPr}>
            <label className={styles.field}>
              <span>Lift</span>
              <select
                value={submitForm.liftType}
                onChange={(e) =>
                  setSubmitForm((p) => ({ ...p, liftType: e.target.value as LiftType }))
                }
              >
                <option value="squat">Squat</option>
                <option value="bench">Bench Press</option>
                <option value="deadlift">Deadlift</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Weight (kg)</span>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={submitForm.weightKg}
                onChange={(e) => setSubmitForm((p) => ({ ...p, weightKg: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Video (max 100MB)</span>
              <input
                type="file"
                accept="video/*"
                required
                onChange={(e) =>
                  setSubmitForm((p) => ({ ...p, video: e.target.files?.[0] ?? null }))
                }
              />
            </label>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading…" : "Submit PR"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default MyPrs;
