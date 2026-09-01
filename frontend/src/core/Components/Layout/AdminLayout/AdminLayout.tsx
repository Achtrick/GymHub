import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { MenuIcon } from "../../Controls/Icons";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./AdminLayout.module.scss";

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.adminLayout}>
      <div className={styles.topbar}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <Link to="/" className={styles.topbarBrand}>
          Gym<span>Hub</span> Admin
        </Link>
      </div>

      {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />}

      <Sidebar isOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
