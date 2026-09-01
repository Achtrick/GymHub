import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { resendActivation } from "../../api/auth";
import GoogleSignInButton from "../../Components/Controls/GoogleSignInButton/GoogleSignInButton";
import { useAuth } from "../../auth/useAuth";
import styles from "./Login.module.scss";

function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }

  const sessionMessage = (location.state as { message?: string } | null)?.message;

  const redirectAfterLogin = () => {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNeedsActivation(false);
    setResendState("idle");
    setIsSubmitting(true);
    try {
      await login(email, password);
      redirectAfterLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      const cause = err instanceof Error ? err.cause : undefined;
      if (
        axios.isAxiosError(cause) &&
        (cause.response?.data as { code?: string } | undefined)?.code === "account_not_activated"
      ) {
        setNeedsActivation(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendActivation = async () => {
    setResendState("sending");
    try {
      await resendActivation(email);
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    try {
      await loginWithGoogle(idToken);
      redirectAfterLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brand}>
          Gym<span>Hub</span>
        </span>
        <h1>Welcome back</h1>
        <p className={styles.subtitle}>Log in to your account to continue.</p>

        {sessionMessage && !error && <p className={styles.notice}>{sessionMessage}</p>}
        {error && <p className={styles.error}>{error}</p>}
        {needsActivation && (
          <p className={styles.notice}>
            {resendState === "sent" ? (
              "If that account needs activation, a new email is on its way."
            ) : (
              <button
                type="button"
                className={styles.resendLink}
                onClick={handleResendActivation}
                disabled={resendState === "sending"}
              >
                {resendState === "sending" ? "Sending…" : "Resend activation email"}
              </button>
            )}
          </p>
        )}

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
          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Link to="/forgot-password" className={styles.forgotPassword}>
            Forgot password?
          </Link>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in…" : "Login"}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} />

        <p className={styles.footer}>
          No account? <Link to="/register">Register</Link>
        </p>

        <p className={styles.terms}>
          By continuing, you agree to GymHub's{" "}
          <Link to="/terms" target="_blank" rel="noreferrer">
            Terms and Conditions
          </Link>
          , including how your data is saved and used, and that automated tools (including AI)
          may help operate the Service.
        </p>
      </div>
    </div>
  );
}

export default Login;
