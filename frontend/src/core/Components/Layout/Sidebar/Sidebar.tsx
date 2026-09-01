import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";
import styles from "./Sidebar.module.scss";

interface SidebarProps {
  isOpen?: boolean;
  onNavigate?: () => void;
}

function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onNavigate?.();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      <Link to="/" className={styles.brand} onClick={onNavigate}>
        Gym<span>Hub</span> Admin
      </Link>
      <nav className={styles.nav} onClick={onNavigate}>
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/submissions"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          Submissions
        </NavLink>
        <NavLink
          to="/admin/weigh-ins"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          Weigh-ins
        </NavLink>
        <NavLink
          to="/admin/orders"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          Orders
        </NavLink>
        <NavLink
          to="/admin/card-pricing"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          Card pricing
        </NavLink>
      </nav>
      <div className={styles.footer}>
        {user && <span className={styles.email}>{user.email}</span>}
        <button className={styles.logout} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
