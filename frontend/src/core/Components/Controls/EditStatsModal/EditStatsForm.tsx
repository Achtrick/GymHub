import { useEffect, useState, type FormEvent } from "react";
import { getMyWeightEntries, submitWeightEntry, type WeightEntry } from "../../../api/weightEntries";
import type { Sex } from "../../../auth/auth-context";
import { useAuth } from "../../../auth/useAuth";
import { calculateWeightClass } from "../../../utils/weightClass";
import styles from "./EditStatsModal.module.scss";

interface EditStatsFormProps {
  onSaved?: () => void;
}

function EditStatsForm({ onSaved }: EditStatsFormProps) {
  const { user, updateProfile } = useAuth();

  const [profileForm, setProfileForm] = useState({
    dateOfBirth: user?.dateOfBirth?.slice(0, 10) ?? "",
    heightCm: user?.heightCm?.toString() ?? "",
    sex: (user?.sex ?? "") as Sex | "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [weightEntries, setWeightEntries] = useState<WeightEntry[] | null>(null);
  const [weightForm, setWeightForm] = useState<{ weightKg: string; photo: File | null }>({
    weightKg: "",
    photo: null,
  });
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);

  const loadWeightEntries = () => getMyWeightEntries().then(setWeightEntries).catch(() => null);

  useEffect(() => {
    loadWeightEntries();
  }, []);

  const pendingWeightEntry = weightEntries?.find((entry) => entry.status === "pending");
  const weightClassPreview = calculateWeightClass(
    profileForm.sex || user?.sex,
    weightForm.weightKg ? Number(weightForm.weightKg) : null,
  );

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileForm.sex) return;
    setSavingProfile(true);
    try {
      await updateProfile({
        dateOfBirth: profileForm.dateOfBirth
          ? new Date(profileForm.dateOfBirth).toISOString()
          : null,
        heightCm: profileForm.heightCm ? Number(profileForm.heightCm) : null,
        sex: profileForm.sex,
      });
      onSaved?.();
    } finally {
      setSavingProfile(false);
    }
  };

  const handleWeightSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setWeightError(null);

    if (!weightForm.photo) {
      setWeightError("Please attach a photo of yourself on the scale.");
      return;
    }

    setIsSubmittingWeight(true);
    try {
      await submitWeightEntry(Number(weightForm.weightKg), weightForm.photo);
      setWeightForm({ weightKg: "", photo: null });
      await loadWeightEntries();
      onSaved?.();
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : "Could not submit your weight.");
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  return (
    <div className={styles.formsWrap}>
      {!user?.sex && (
        <p className={styles.pendingNotice}>
          Set your sex to submit PRs and show up correctly on the leaderboard.
        </p>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Body measurements</h3>
        <form className={styles.form} onSubmit={handleProfileSubmit}>
          <label className={styles.field}>
            <span>Sex</span>
            <select
              required
              value={profileForm.sex}
              onChange={(e) => setProfileForm((p) => ({ ...p, sex: e.target.value as Sex }))}
            >
              <option value="" disabled hidden>
                Select…
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Date of birth</span>
            <input
              type="date"
              value={profileForm.dateOfBirth}
              onChange={(e) => setProfileForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span>Height (cm)</span>
            <input
              type="number"
              min={50}
              max={260}
              value={profileForm.heightCm}
              onChange={(e) => setProfileForm((p) => ({ ...p, heightCm: e.target.value }))}
            />
          </label>
          <button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save"}
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Bodyweight</h3>
        <p className={styles.hint}>
          Current: {user?.bodyWeightKg ? `${user.bodyWeightKg}kg` : "not set"}
          {user?.weightClass ? ` · ${user.weightClass}` : ""}
        </p>
        {pendingWeightEntry && (
          <p className={styles.pendingNotice}>
            {pendingWeightEntry.bodyWeightKg}kg is awaiting admin verification.
          </p>
        )}
        {weightError && <p className={styles.error}>{weightError}</p>}
        <form className={styles.form} onSubmit={handleWeightSubmit}>
          <label className={styles.field}>
            <span>New bodyweight (kg)</span>
            <input
              type="number"
              min={20}
              max={400}
              required
              value={weightForm.weightKg}
              onChange={(e) => setWeightForm((p) => ({ ...p, weightKg: e.target.value }))}
            />
          </label>
          {weightClassPreview ? (
            <p className={styles.hint}>Weight class: {weightClassPreview}</p>
          ) : (
            !user?.sex && (
              <p className={styles.hint}>Set your sex above to see your weight class.</p>
            )
          )}
          <label className={styles.field}>
            <span>Photo on the scale (for verification)</span>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) =>
                setWeightForm((p) => ({ ...p, photo: e.target.files?.[0] ?? null }))
              }
            />
          </label>
          <button type="submit" disabled={isSubmittingWeight}>
            {isSubmittingWeight ? "Submitting…" : "Submit for verification"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditStatsForm;
