import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { confirmCheckoutSession, getBadgesByUser, getMyBadges, type Badge } from "../../api/badges";
import { getPrsByUser, type LiftType, type PrSubmission } from "../../api/prs";
import { getPublicProfile, type PublicProfile } from "../../api/users";
import { getWeightEntriesByUser, type WeightEntry } from "../../api/weightEntries";
import { useAuth } from "../../auth/useAuth";
import Avatar from "../../Components/Controls/Avatar/Avatar";
import BadgeCard from "../../Components/Controls/BadgeCard/BadgeCard";
import EditStatsForm from "../../Components/Controls/EditStatsModal/EditStatsForm";
import { ChartIcon, MedalIcon, PencilIcon, ScaleIcon, UserIcon } from "../../Components/Controls/Icons";
import SwipeableTabs from "../../Components/Controls/SwipeableTabs/SwipeableTabs";
import TrendChart, { type TrendPoint } from "../../Components/Controls/TrendChart/TrendChart";
import styles from "./Profile.module.scss";

const LIFT_LABELS: Record<LiftType, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
};

const LIFT_ORDER: LiftType[] = ["squat", "bench", "deadlift"];

const PROFILE_TABS = [
  { id: "stats", label: "Stats", icon: <UserIcon /> },
  { id: "weight", label: "Weight", icon: <ScaleIcon /> },
  { id: "lifts", label: "Lifts", icon: <ChartIcon /> },
  { id: "badges", label: "Badges", icon: <MedalIcon /> },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Profile() {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) return null;
  return <ProfileContent key={userId} userId={userId} />;
}

function ProfileContent({ userId }: { userId: string }) {
  const { user: currentUser } = useAuth();
  const initialCheckoutState = new URLSearchParams(window.location.search).get("checkout");
  const [activeIndex, setActiveIndex] = useState(initialCheckoutState ? 3 : 0);
  const [checkoutNotice, setCheckoutNotice] = useState<{
    type: "success" | "cancelled" | "error";
    message: string;
  } | null>(null);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [prs, setPrs] = useState<PrSubmission[] | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[] | null>(null);
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditStats, setShowEditStats] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const loadBadges = () =>
    (isOwnProfile ? getMyBadges() : getBadgesByUser(userId)).then(setBadges).catch(() => null);

  const loadProfile = () =>
    Promise.all([getPublicProfile(userId), getWeightEntriesByUser(userId)])
      .then(([profileData, weightData]) => {
        setProfile(profileData);
        setWeightEntries(weightData);
      })
      .catch(() => setError("Could not load this profile."));

  useEffect(() => {
    Promise.all([
      getPublicProfile(userId),
      getPrsByUser(userId),
      getWeightEntriesByUser(userId),
      isOwnProfile ? getMyBadges() : getBadgesByUser(userId),
    ])
      .then(([profileData, prsData, weightData, badgeData]) => {
        setProfile(profileData);
        setPrs(prsData);
        setWeightEntries(weightData);
        setBadges(badgeData);
      })
      .catch(() => setError("Could not load this profile."));
  }, [userId, isOwnProfile]);

  // Landed back here from Stripe Checkout — confirm the payment actually
  // went through before treating the card as ordered.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;

    window.history.replaceState(null, "", window.location.pathname);

    if (checkout === "cancelled") {
      Promise.resolve().then(() =>
        setCheckoutNotice({ type: "cancelled", message: "Checkout was cancelled — nothing was charged." }),
      );
      return;
    }

    const sessionId = params.get("session_id");
    if (checkout === "success" && sessionId) {
      confirmCheckoutSession(sessionId)
        .then(() => {
          setCheckoutNotice({ type: "success", message: "Payment received — your card is on its way!" });
          loadBadges();
        })
        .catch(() =>
          setCheckoutNotice({
            type: "error",
            message: "We couldn't confirm that payment. Contact support if you were charged.",
          }),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Loading profile…</p>
      </div>
    );
  }

  const weightPoints: TrendPoint[] =
    weightEntries?.map((entry) => ({
      label: formatDate(entry.createdAt),
      value: entry.bodyWeightKg,
    })) ?? [];

  const visibleBadges = isOwnProfile ? badges : badges?.filter((b) => b.claimed);

  return (
    <SwipeableTabs tabs={PROFILE_TABS} activeIndex={activeIndex} onChange={setActiveIndex}>
      {[
        <div className={styles.page} key="stats">
          <Link to="/" className={styles.back}>
            ← Back
          </Link>

          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <Avatar name={profile.fullName} photoUrl={profile.profilePictureUrl} size="large" />
              <div>
                <h1>{profile.fullName}</h1>
                {isOwnProfile && <span className={styles.youBadge}>This is you</span>}
              </div>
            </div>
            {isOwnProfile && (
              <button
                type="button"
                className={showEditStats ? styles.editButtonActive : styles.editButton}
                onClick={() => setShowEditStats((open) => !open)}
              >
                <PencilIcon /> {showEditStats ? "Hide" : "Edit stats"}
              </button>
            )}
          </div>

          <div className={styles.statsCard}>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>Sex</span>
                <strong>{profile.sex ?? "—"}</strong>
              </div>
              <div className={styles.stat}>
                <span>Age</span>
                <strong>{profile.age ?? "—"}</strong>
              </div>
              <div className={styles.stat}>
                <span>Height</span>
                <strong>{profile.heightCm ? `${profile.heightCm}cm` : "—"}</strong>
              </div>
              <div className={styles.stat}>
                <span>Weight</span>
                <strong>{profile.bodyWeightKg ? `${profile.bodyWeightKg}kg` : "—"}</strong>
              </div>
              <div className={styles.stat}>
                <span>Class</span>
                <strong>{profile.weightClass ?? "—"}</strong>
              </div>
            </div>

            {isOwnProfile && showEditStats && (
              <div className={styles.editStatsPanel}>
                <EditStatsForm onSaved={loadProfile} />
              </div>
            )}
          </div>
        </div>,

        <div className={styles.page} key="weight">
          <h1 className={styles.tabTitle}>Bodyweight progress</h1>
          <div className={styles.card}>
            <TrendChart points={weightPoints} unit="kg" />
          </div>
        </div>,

        <div className={styles.page} key="lifts">
          <h1 className={styles.tabTitle}>Lift progress</h1>
          <div className={styles.liftGrid}>
            {LIFT_ORDER.map((liftType) => {
              const liftPrs = prs?.filter((pr) => pr.liftType === liftType) ?? [];
              const points: TrendPoint[] = liftPrs.map((pr) => ({
                label: formatDate(pr.createdAt),
                value: pr.weightKg,
              }));
              const best = liftPrs.length
                ? Math.max(...liftPrs.map((pr) => pr.weightKg))
                : null;

              return (
                <div className={styles.card} key={liftType}>
                  <div className={styles.liftHeader}>
                    <h3>{LIFT_LABELS[liftType]}</h3>
                    {best !== null && <span className={styles.best}>PR {best}kg</span>}
                  </div>
                  <TrendChart points={points} unit="kg" />
                </div>
              );
            })}
          </div>
        </div>,

        <div className={styles.page} key="badges">
          <h1 className={styles.tabTitle}>Badges</h1>
          {checkoutNotice && (
            <p className={`${styles.checkoutNotice} ${styles[checkoutNotice.type]}`}>
              {checkoutNotice.message}
              <button type="button" onClick={() => setCheckoutNotice(null)}>
                Dismiss
              </button>
            </p>
          )}
          {visibleBadges && visibleBadges.length === 0 && (
            <p className={styles.hint}>
              {isOwnProfile
                ? "No badges yet — set a verified PR to start unlocking them."
                : "No badges claimed yet."}
            </p>
          )}
          {visibleBadges && visibleBadges.length > 0 && (
            <div className={styles.badgeGrid}>
              {visibleBadges.map((badge) => (
                <BadgeCard
                  key={`${badge.liftType}-${badge.tier}`}
                  badge={badge}
                  interactive={isOwnProfile}
                  onChange={loadBadges}
                />
              ))}
            </div>
          )}
        </div>,
      ]}
    </SwipeableTabs>
  );
}

export default Profile;
