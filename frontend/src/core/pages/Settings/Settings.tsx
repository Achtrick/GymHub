import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../../api/apiClient";
import { useAuth } from "../../auth/useAuth";
import styles from "./Settings.module.scss";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function Settings() {
  const { user, updateProfileInfo, updateProfilePicture, changePassword } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phoneNumber: user?.phoneNumber ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (!user) {
    return null;
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await updateProfileInfo(form);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoError(null);
    setIsUploadingPhoto(true);
    try {
      await updateProfilePicture(file);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not upload your photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        ← Back
      </Link>
      <h1>Settings</h1>

      <div className={styles.avatarSection}>
        {user.profilePictureUrl ? (
          <img
            className={styles.avatarPreview}
            src={mediaUrl(user.profilePictureUrl)}
            alt=""
          />
        ) : (
          <span className={styles.avatarFallback}>
            {initials(user.firstName, user.lastName)}
          </span>
        )}
        <label className={styles.uploadButton}>
          {isUploadingPhoto ? "Uploading…" : "Change photo"}
          <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
        </label>
      </div>
      {photoError && <p className={styles.error}>{photoError}</p>}

      {saveError && <p className={styles.error}>{saveError}</p>}
      {saved && <p className={styles.success}>Saved.</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>First name</span>
          <input
            type="text"
            required
            value={form.firstName}
            onChange={(e) => {
              setSaved(false);
              setForm((p) => ({ ...p, firstName: e.target.value }));
            }}
          />
        </label>
        <label className={styles.field}>
          <span>Last name</span>
          <input
            type="text"
            required
            value={form.lastName}
            onChange={(e) => {
              setSaved(false);
              setForm((p) => ({ ...p, lastName: e.target.value }));
            }}
          />
        </label>
        <label className={styles.field}>
          <span>Phone number</span>
          <input
            type="tel"
            required
            value={form.phoneNumber}
            onChange={(e) => {
              setSaved(false);
              setForm((p) => ({ ...p, phoneNumber: e.target.value }));
            }}
          />
        </label>
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </form>

      {user.hasPassword && (
        <>
          <h2 className={styles.sectionTitle}>Change password</h2>

          {passwordError && <p className={styles.error}>{passwordError}</p>}
          {passwordSaved && <p className={styles.success}>Password updated.</p>}

          <form className={styles.form} onSubmit={handleChangePassword}>
            <label className={styles.field}>
              <span>Old password</span>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span>New password</span>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span>Confirm new password</span>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
              />
            </label>
            <button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Saving…" : "Change password"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default Settings;
