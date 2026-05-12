import { toast } from "react-toastify";

// Clear everything related to auth
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("sessionActive");
};

// Logout + redirect
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const forceLogout = (navigate?: any, message?: string) => {
  clearAuth();

  if (message) {
    toast.info(message);
  }

  if (navigate) {
    navigate("/signin", { replace: true });
  } else {
    // fallback (for API calls)
    window.location.href = "/signin";
  }
};
