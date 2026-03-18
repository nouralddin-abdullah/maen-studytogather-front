import { Outlet } from "react-router-dom";
import Sidebar from "@/components/common/Sidebar";
import MobileSidebar from "@/components/common/MobileSidebar";

/**
 * Discover layout — full-screen immersive layout with sidebar.
 * Used for the discover page and other app-level pages.
 */
function DiscoverLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-surface relative">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -end-[10%] w-[35%] h-[35%] bg-brand-500/8 dark:bg-brand-500/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] -start-[10%] w-[35%] h-[35%] bg-brand-400/6 dark:bg-brand-400/4 blur-[100px] rounded-full" />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex h-full w-full p-4 md:pb-4 pb-[84px] gap-4">
        {/* Sidebar (Desktop) */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 flex flex-col gap-4 overflow-hidden relative">
          <Outlet />
        </main>

        {/* Mobile Sidebar (Bottom Nav) */}
        <MobileSidebar />
      </div>
    </div>
  );
}

export default DiscoverLayout;


