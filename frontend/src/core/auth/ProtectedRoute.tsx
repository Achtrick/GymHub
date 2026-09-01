import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "./auth-context";
import { useAuth } from "./useAuth";

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

function homePathFor(role: Role) {
  return role === "admin" ? "/admin" : "/";
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
