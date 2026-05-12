import { Navigate, Outlet } from "react-router-dom";
import { toast } from "react-toastify";

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");

  // ❌ Not logged in
  if (!token) {
    toast.error("Please login to continue");
    return <Navigate to="/signin" replace />;
  }

  // ✅ Logged in → render nested routes
  return <Outlet />;
}
