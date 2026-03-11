import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import { ROUTES } from "@/utils/constants";

/**
 * Main layout — used for all non-auth pages.
 * On the home page the navbar is transparent (hero bleeds behind it).
 */
function MainLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === ROUTES.HOME;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Navbar overlays the hero on home */}
      {isHome ? (
        <div className="absolute inset-x-0 top-0 z-50">
          <Navbar transparent />
        </div>
      ) : (
        <Navbar />
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
