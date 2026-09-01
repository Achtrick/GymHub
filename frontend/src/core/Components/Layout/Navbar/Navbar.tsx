import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";
import Avatar from "../../Controls/Avatar/Avatar";
import { LogoutIcon, SettingsIcon, UserIcon } from "../../Controls/Icons";
import NotificationsBell from "../../Controls/NotificationsBell/NotificationsBell";
import styles from "./Navbar.module.scss";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const handleSettings = () => {
    setMenuOpen(false);
    navigate("/settings");
  };

  const handleViewProfile = () => {
    if (!user) return;
    setMenuOpen(false);
    navigate(`/profile/${user.id}`);
  };

  const handleBrandClick = (event: React.MouseEvent) => {
    if (location.pathname === "/") {
      event.preventDefault();
      window.dispatchEvent(new Event("gymhub:go-to-feed"));
    }
  };

  return (
    <div className={styles.navbar}>
      <Link to="/" className={styles.brand} onClick={handleBrandClick}>
        Gym<span>Hub</span>
      </Link>

      {user && (
        <div className={styles.actions}>
          <NotificationsBell />

          <div className={styles.profile} ref={menuRef}>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Avatar
              name={`${user.firstName} ${user.lastName}`}
              photoUrl={user.profilePictureUrl}
            />
          </button>

          {menuOpen && (
            <div className={styles.menu}>
              <div className={styles.menuHeader}>
                <span className={styles.menuName}>
                  {user.firstName} {user.lastName}
                </span>
                <span className={styles.menuEmail}>{user.email}</span>
              </div>
              <button type="button" className={styles.menuItem} onClick={handleViewProfile}>
                <UserIcon /> My Profile
              </button>
              <button type="button" className={styles.menuItem} onClick={handleSettings}>
                <SettingsIcon /> Settings
              </button>
              <button type="button" className={styles.menuItem} onClick={handleLogout}>
                <LogoutIcon /> Logout
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;
