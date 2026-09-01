import { useEffect, useState } from "react";
import { getDashboardMetrics, type DashboardMetrics } from "../../../api/dashboard";
import TrendChart from "../../../Components/Controls/TrendChart/TrendChart";
import styles from "./Dashboard.module.scss";

function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(() => setError("Could not load dashboard metrics."));
  }, []);

  return (
    <div className={styles.dashboard}>
      <h1>Admin Dashboard</h1>
      <p className={styles.subtitle}>App-wide activity at a glance.</p>

      {error && <p className={styles.error}>{error}</p>}
      {!metrics && !error && <p className={styles.hint}>Loading…</p>}

      {metrics && (
        <>
          <div className={styles.statGrid}>
            <div className={styles.stat}>
              <span>Total users</span>
              <strong>{metrics.totalUsers}</strong>
              <small>+{metrics.newUsersLast30Days} in the last 30 days</small>
            </div>
            <div className={styles.stat}>
              <span>PR submissions</span>
              <strong>{metrics.totalPrSubmissions}</strong>
              <small>
                {metrics.pendingPrSubmissions} pending · {metrics.approvedPrSubmissions} approved
              </small>
            </div>
            <div className={styles.stat}>
              <span>Pending weigh-ins</span>
              <strong>{metrics.pendingWeightEntries}</strong>
              <small>awaiting review</small>
            </div>
            <div className={styles.stat}>
              <span>Card orders</span>
              <strong>{metrics.totalOrders}</strong>
              <small>
                {metrics.ordersReceived} received · {metrics.ordersInShipping} shipping ·{" "}
                {metrics.ordersShipped} shipped
              </small>
            </div>
            <div className={`${styles.stat} ${styles.highlight}`}>
              <span>Total revenue</span>
              <strong>€{metrics.totalRevenueEur.toFixed(2)}</strong>
              <small>from card orders</small>
            </div>
          </div>

          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <h2>User growth (30 days)</h2>
              <TrendChart points={metrics.userGrowth} unit=" users" />
            </div>
            <div className={styles.chartCard}>
              <h2>Revenue (30 days)</h2>
              <TrendChart points={metrics.revenueTrend} unit="€" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
