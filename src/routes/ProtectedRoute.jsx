import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, isAuthenticated, authLoading } = useContext(AuthContext);
  const location = useLocation();

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !currentUser) {
    const manualLogout = sessionStorage.getItem("manualLogout") === "true";

    if (manualLogout) {
      sessionStorage.removeItem("manualLogout");
      return <Navigate to="/" replace />;
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    allowedRoles &&
    Array.isArray(allowedRoles) &&
    !allowedRoles.includes(currentUser.role)
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;