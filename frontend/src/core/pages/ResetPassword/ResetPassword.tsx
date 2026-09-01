import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/auth";
import styles from "./ResetPassword.module.scss";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(message ?? "This reset link is invalid or has expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brand}>
          Gym<span>Hub</span>
        </span>
        <h1>Choose a new password</h1>

        {!token && !done && (
          <p className={styles.error}>
            This link is missing its reset token. Request a new one from the{" "}
            <Link to="/forgot-password">forgot password</Link> page.
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {done ? (
          <>
            <p className={styles.notice}>Your password has been reset.</p>
            <p className={styles.footer}>
              <Link to="/login">Continue to login →</Link>
            </p>
          </>
        ) : (
          token && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>New password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Confirm new password</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )
        )}

        {!done && (
          <p className={styles.footer}>
            <Link to="/login">← Back to login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
