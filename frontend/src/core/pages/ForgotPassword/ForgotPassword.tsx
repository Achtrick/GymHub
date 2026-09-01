import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth";
import styles from "./ForgotPassword.module.scss";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(message ?? "Something went wrong. Please try again.");
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
        <h1>Reset your password</h1>
        <p className={styles.subtitle}>
          Enter the email on your account and we'll send you a link to reset your password.
        </p>

        {error && <p className={styles.error}>{error}</p>}

        {submitted ? (
          <p className={styles.notice}>
            If that email is registered, a reset link is on its way. Check your inbox (and spam
            folder).
          </p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          <Link to="/login">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
