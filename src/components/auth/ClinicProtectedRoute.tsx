import { JSX } from "react";
import { Navigate } from "react-router-dom";

// export default function ClinicProtectedRoute({ children }: { children: JSX.Element }) {
//   const role = localStorage.getItem("role");
//   const token = localStorage.getItem("token");

//   if (!token || role !== "CLINIC" && role !== "SUPER_ADMIN") {
//     return <Navigate to="/signin" replace />;
//   }

//   return children;
// }
export default function ClinicProtectedRoute({ children }: { children: JSX.Element }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  

  if (!token || role === "SUPER ADMIN") {
    
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
