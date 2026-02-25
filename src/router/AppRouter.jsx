import { Routes, Route } from "react-router-dom";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import DiscoverLayout from "@/layouts/DiscoverLayout";

// Route guards
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";

// Pages
import HomePage from "@/pages/Home/HomePage";
import LoginPage from "@/pages/Auth/LoginPage";
import RegisterPage from "@/pages/Auth/RegisterPage";
import DiscoverPage from "@/pages/Discover/DiscoverPage";
import ProfilePage from "@/pages/Profile/ProfilePage";
import NotFoundPage from "@/pages/NotFound/NotFoundPage";

/**
 * Application router — defines all routes and their layouts.
 */
function AppRouter() {
  return (
    <Routes>
      {/* Public pages with main layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      {/* App pages with discover/sidebar layout */}
      <Route
        element={
          <ProtectedRoute>
            <DiscoverLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/user/:id" element={<ProfilePage />} />
      </Route>

      {/* Auth pages with auth layout */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route
          path="login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;
