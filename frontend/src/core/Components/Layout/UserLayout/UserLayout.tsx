import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import styles from "./UserLayout.module.scss";

function UserLayout() {
  return (
    <div className={styles.userLayout}>
      <Navbar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default UserLayout;
