import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import styles from "./Activate.module.scss";

function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, activate } = useAuth();

  const [status, setStatus] = useState<"pending" | "success" | "error">(
    token ? "pending" : "error",
  );
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    activate(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "This activation link is invalid or has expired.");
        setStatus("error");
      });
  }, [token, activate]);

  if (status === "success" && user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brand}>
          Gym<span>Hub</span>
        </span>

        {status === "pending" && <p className={styles.subtitle}>Activating your account…</p>}

        {status === "error" && (
          <>
            <h1>Activation failed</h1>
            <p className={styles.error}>
              {error ?? "This activation link is missing its token."}
            </p>
            <p className={styles.footer}>
              <Link to="/login">← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Activate;
