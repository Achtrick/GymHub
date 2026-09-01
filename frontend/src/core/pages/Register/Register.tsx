import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../../Components/Controls/GoogleSignInButton/GoogleSignInButton";
import type { Sex } from "../../auth/auth-context";
import { useAuth } from "../../auth/useAuth";
import styles from "./Register.module.scss";

const initialForm = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  sex: "male" as Sex,
};

function Register() {
  const { user, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }

  const updateField =
    (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        sex: form.sex,
      });
      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    try {
      await loginWithGoogle(idToken);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  };

  if (registered) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <span className={styles.brand}>
            Gym<span>Hub</span>
          </span>
          <h1>Check your email</h1>
          <p className={styles.subtitle}>
            We sent an activation link to <strong>{form.email}</strong>. Click it to activate your
            account before logging in.
          </p>
          <p className={styles.footer}>
            <Link to="/login">← Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brand}>
          Gym<span>Hub</span>
        </span>
        <h1>Create your account</h1>
        <p className={styles.subtitle}>Join GymHub in a few seconds.</p>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={updateField("email")}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>First name</span>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={updateField("firstName")}
              />
            </label>
            <label className={styles.field}>
              <span>Last name</span>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={updateField("lastName")}
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Phone number</span>
              <input
                type="tel"
                required
                value={form.phoneNumber}
                onChange={updateField("phoneNumber")}
              />
            </label>
            <label className={styles.field}>
              <span>Sex</span>
              <select value={form.sex} onChange={updateField("sex")}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={updateField("password")}
              />
            </label>
            <label className={styles.field}>
              <span>Confirm password</span>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
              />
            </label>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} />

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <p className={styles.terms}>
          By creating an account, you agree to GymHub's{" "}
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

export default Register;
