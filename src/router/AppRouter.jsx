import { Routes, Route, Outlet } from "react-router-dom";

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
import AuthCallbackPage from "@/pages/Auth/AuthCallbackPage";
import DiscoverPage from "@/pages/Discover/DiscoverPage";
import ProfilePage from "@/pages/Profile/ProfilePage";
import RoomPage from "@/pages/Room/RoomPage";
import CreateRoomPage from "@/pages/CreateRoom/CreateRoomPage";
import FriendsPage from "@/pages/Friends/FriendsPage";
import NotFoundPage from "@/pages/NotFound/NotFoundPage";
import LeaderboardPage from "@/pages/Leaderboard/LeaderboardPage";

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
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/create-room" element={<CreateRoomPage />} />
        <Route path="/user/:id" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>

      {/* Room page — standalone full-screen (no sidebar) */}
      <Route
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path="/room/:inviteCode" element={<RoomPage />} />
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
        <Route path="callback" element={<AuthCallbackPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;
