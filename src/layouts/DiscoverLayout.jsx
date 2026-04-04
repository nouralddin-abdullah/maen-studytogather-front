import { Outlet } from "react-router-dom";
import Sidebar from "@/components/common/Sidebar";
import MobileSidebar from "@/components/common/MobileSidebar";

/**
 * Discover layout — full-screen immersive layout with sidebar.
 * Used for the discover page and other app-level pages.
 */
function DiscoverLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-surface">
      {/* Content layer */}
      <div className="flex h-full w-full p-3 md:pb-3 pb-[84px] gap-3">
        {/* Sidebar (Desktop) */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 flex flex-col gap-3 overflow-hidden">
          <Outlet />
        </main>

        {/* Mobile Sidebar (Bottom Nav) */}
        <MobileSidebar />
      </div>
    </div>
  );
}

export default DiscoverLayout;


