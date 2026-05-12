import { forceLogout } from "../../utils/auth";
import {url} from "../../baseUrl";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logout = async (navigate: any) => {
  try {
    const token = localStorage.getItem("token");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("sessionActive");
    localStorage.removeItem("clinicId");
    localStorage.removeItem("clinic id");
    localStorage.removeItem("_id");

    // 🔹 Call backend logout API (if exists)
    await fetch(`${url}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    // Even if API fails, we still logout locally
    console.error("Logout API failed", error);
  } finally {
    // 🔥 Always force logout
    forceLogout(navigate, "You have been logged out");
  }
};
