import { mediaUrl } from "../../../api/apiClient";
import styles from "./Avatar.module.scss";

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "small" | "medium" | "large";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

function Avatar({ name, photoUrl, size = "medium" }: AvatarProps) {
  const sizeClass =
    size === "small" ? styles.small : size === "large" ? styles.large : styles.medium;

  return (
    <span className={`${styles.avatar} ${sizeClass}`}>
      {photoUrl ? (
        <img className={styles.img} src={mediaUrl(photoUrl)} alt="" />
      ) : (
        <span className={styles.fallback}>{initials(name)}</span>
      )}
    </span>
  );
}

export default Avatar;
