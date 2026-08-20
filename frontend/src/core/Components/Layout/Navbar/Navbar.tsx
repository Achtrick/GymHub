import axios from "axios";
import styles from "./Navbar.module.scss";

function Navbar() {
  const API_URL = import.meta.env.VITE_API_URL ?? "/api";
  const testApi = async () => {
    try {
      const items: { data: any[] } = await axios.get(`${API_URL}/items`);
      alert(JSON.stringify(items.data));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.navbar}>
      <button onClick={testApi}>TestApi</button>
    </div>
  );
}

export default Navbar;
