import { Outlet } from "react-router-dom";
import Navbar from "@/components/common/Navbar";

/**
 * Main layout — used for all non-auth pages.
 * Contains the navbar and a content area.
 */
function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
