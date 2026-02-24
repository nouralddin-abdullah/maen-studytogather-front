import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores";

/**
 * Protects routes that require authentication.
 * Redirects to login if user is not authenticated.
 */
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
