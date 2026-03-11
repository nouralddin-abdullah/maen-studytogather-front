import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { APP_NAME, ROUTES } from "@/utils/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";

/**
 * Top navigation bar — shown on all main layout pages.
 * Pass `transparent` to render over hero sections with no background.
 */
function Navbar({ transparent = false }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        transparent
          ? "bg-transparent"
          : "bg-surface-elevated/80 backdrop-blur-md border-b border-border"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <img
              src="/pwa/StudyShell.png"
              alt={APP_NAME}
              className="h-11 w-11 rounded-xl object-contain"
            />
            <span
              className={`font-display text-2xl font-bold ${
                transparent
                  ? "text-gradient dark:text-text-primary"
                  : "text-text-primary"
              }`}
            >
              {APP_NAME}
            </span>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.DISCOVER}
                  className={`text-sm font-medium transition-colors hover:text-brand-600 ${
                    transparent
                      ? "text-black dark:text-text-secondary"
                      : "text-text-secondary"
                  }`}
                >
                  اكتشف الغرف
                </Link>
                <span
                  className={`text-sm ${
                    transparent
                      ? "text-black/70 dark:text-text-muted"
                      : "text-text-muted"
                  }`}
                >
                  أهلاً، {user?.nickName || user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className={`text-sm transition-colors cursor-pointer hover:text-error ${
                    transparent
                      ? "text-black dark:text-text-secondary"
                      : "text-text-secondary"
                  }`}
                >
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm text-text-secondary hover:text-brand-600 transition-colors font-medium"
                >
                  دخول
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium"
                >
                  حساب جديد
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
