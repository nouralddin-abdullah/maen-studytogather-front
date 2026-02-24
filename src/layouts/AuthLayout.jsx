import { Outlet } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "@/utils/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";

/**
 * Auth layout — used for login and register pages.
 * Clean, focused layout with branding sidebar.
 */
function AuthLayout() {
  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-bl from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden items-center justify-center p-12">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-6xl font-bold mb-4">{APP_NAME}</h1>
          <p className="text-xl text-white/80 font-light">{APP_TAGLINE}</p>
          <div className="mt-8 w-16 h-1 bg-white/40 mx-auto rounded-full" />
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex flex-col bg-surface">
        {/* Theme toggle in top corner */}
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12 sm:px-12">
          <div className="w-full max-w-lg">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
