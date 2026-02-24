import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores";

/**
 * Redirects authenticated users away from auth pages (login/register).
 */
function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/discover" replace />;
  }

  return children;
}

export default GuestRoute;
