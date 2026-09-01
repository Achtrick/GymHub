import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard, type LeaderboardEntry } from "../../api/prs";
import { useAuth } from "../../auth/useAuth";
import Avatar from "../../Components/Controls/Avatar/Avatar";
import styles from "./Leaderboard.module.scss";

type SexFilter = "all" | "male" | "female";

function weightClassSortValue(weightClass: string): number {
  const match = weightClass.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sexFilter, setSexFilter] = useState<SexFilter>("all");
  const [weightClassFilter, setWeightClassFilter] = useState<string>("all");

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch(() => setError("Could not load the leaderboard."));
  }, []);

  const weightClassOptions = useMemo(() => {
    if (!entries) return [];
    const relevant =
      sexFilter === "all" ? entries : entries.filter((e) => e.sex === sexFilter);
    const classes = Array.from(
      new Set(relevant.map((e) => e.weightClass).filter((c): c is string => !!c)),
    );
    return classes.sort((a, b) => weightClassSortValue(a) - weightClassSortValue(b));
  }, [entries, sexFilter]);

  const filteredEntries = useMemo(() => {
    if (!entries) return null;
    return entries.filter((entry) => {
      if (sexFilter !== "all" && entry.sex !== sexFilter) return false;
      if (weightClassFilter !== "all" && entry.weightClass !== weightClassFilter) return false;
      return true;
    });
  }, [entries, sexFilter, weightClassFilter]);

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>{error}</p>
      </div>
    );
  }

  if (!entries || !filteredEntries) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Loading leaderboard…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Leaderboard</h1>

      {entries.length > 0 && (
        <div className={styles.filters}>
          <label className={styles.filterField}>
            <span>Sex</span>
            <select
              value={sexFilter}
              onChange={(e) => {
                setSexFilter(e.target.value as SexFilter);
                setWeightClassFilter("all");
              }}
            >
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className={styles.filterField}>
            <span>Weight class</span>
            <select
              value={weightClassFilter}
              onChange={(e) => setWeightClassFilter(e.target.value)}
            >
              <option value="all">All</option>
              {weightClassOptions.map((wc) => (
                <option key={wc} value={wc}>
                  {wc}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {entries.length === 0 ? (
        <p className={styles.empty}>No approved lifts yet.</p>
      ) : filteredEntries.length === 0 ? (
        <p className={styles.empty}>No lifters match these filters.</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Sex</th>
                  <th>Age</th>
                  <th>Weight</th>
                  <th>Class</th>
                  <th>Height</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={entry.userId === currentUser?.id ? styles.currentUserRow : undefined}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/profile/${entry.userId}`} className={styles.nameCell}>
                        <Avatar
                          name={entry.fullName}
                          photoUrl={entry.profilePictureUrl}
                          size="small"
                        />
                        <span>{entry.fullName}</span>
                      </Link>
                    </td>
                    <td className={styles.muted}>{entry.sex ?? "—"}</td>
                    <td className={styles.muted}>{entry.age ?? "—"}</td>
                    <td className={styles.muted}>
                      {entry.bodyWeightKg ? `${entry.bodyWeightKg}kg` : "—"}
                    </td>
                    <td className={styles.muted}>{entry.weightClass ?? "—"}</td>
                    <td className={styles.muted}>
                      {entry.heightCm ? `${entry.heightCm}cm` : "—"}
                    </td>
                    <td className={styles.total}>{entry.totalKg}kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.cardList}>
            {filteredEntries.map((entry, index) => (
              <div
                className={`${styles.entryCard} ${entry.userId === currentUser?.id ? styles.currentUserCard : ""}`}
                key={entry.userId}
              >
                <div className={styles.entryHeader}>
                  <span className={styles.rank}>#{index + 1}</span>
                  <Link to={`/profile/${entry.userId}`} className={styles.nameCell}>
                    <Avatar name={entry.fullName} photoUrl={entry.profilePictureUrl} size="small" />
                    <span className={styles.entryName}>{entry.fullName}</span>
                  </Link>
                  <span className={styles.total}>{entry.totalKg}kg</span>
                </div>
                <div className={styles.entryStats}>
                  <div className={styles.stat}>
                    <span>Sex</span>
                    <strong>{entry.sex ?? "—"}</strong>
                  </div>
                  <div className={styles.stat}>
                    <span>Age</span>
                    <strong>{entry.age ?? "—"}</strong>
                  </div>
                  <div className={styles.stat}>
                    <span>Weight</span>
                    <strong>{entry.bodyWeightKg ? `${entry.bodyWeightKg}kg` : "—"}</strong>
                  </div>
                  <div className={styles.stat}>
                    <span>Class</span>
                    <strong>{entry.weightClass ?? "—"}</strong>
                  </div>
                  <div className={styles.stat}>
                    <span>Height</span>
                    <strong>{entry.heightCm ? `${entry.heightCm}cm` : "—"}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Leaderboard;
