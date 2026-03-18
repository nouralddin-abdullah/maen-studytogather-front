import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { APP_NAME, ROUTES } from "@/utils/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useInstallPrompt } from "@/hooks";
import { createPortal } from "react-dom";

/**
 * Mobile Bottom Navigation + Action Sheet Menu
 * Provides a premium native-app-like experience for small screens.
 */
function MobileSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { canInstall, promptInstall } = useInstallPrompt();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const navItems = [
    {
      to: ROUTES.DISCOVER,
      label: "اكتشف",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
    },
    {
      to: ROUTES.FRIENDS,
      label: "أصدقائي",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      to: ROUTES.LEADERBOARD,
      label: "المتصدرين",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      to: ROUTES.MY_PROFILE,
      label: "الملف الشخصي",
      icon: user?.avatar ? (
        <img src={user.avatar} alt="Profile" className="w-7 h-7 rounded-full object-cover border border-border" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 border border-brand-500/30 flex items-center justify-center">
          <span className="text-xs font-bold text-brand-600">
            {(user?.nickName || user?.username || "م").charAt(0)}
          </span>
        </div>
      )
    }
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 start-0 w-full z-50 md:hidden bg-surface-elevated/95 backdrop-blur-3xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe">
        {/* Container spanning full width */}
        <div className="flex items-center justify-around px-2 pt-2 pb-1.5 w-full max-w-md mx-auto">
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className="relative flex flex-col items-center justify-center flex-1 group py-1"
              >
                {/* Icon Container (No background on active) */}
                <div className={`relative flex items-center justify-center w-14 h-8 transition-colors duration-300 ${isActive ? "text-brand-600 dark:text-brand-400" : "text-text-muted group-hover:text-text-primary"}`}>
                  {item.icon}
                </div>
                
                {/* Micro Label */}
                <span className={`text-[10px] mt-1 font-semibold transition-all duration-300 ${isActive ? "text-brand-600 dark:text-brand-400" : "text-text-muted"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="relative flex flex-col items-center justify-center flex-1 group py-1 cursor-pointer"
          >
            <div className={`relative flex items-center justify-center w-14 h-8 transition-colors duration-300 ${isMenuOpen ? "text-text-primary" : "text-text-muted group-hover:text-text-primary"}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </div>
            <span className={`text-[10px] mt-1 font-semibold transition-all duration-300 ${isMenuOpen ? "text-text-primary" : "text-text-muted"}`}>
              المزيد
            </span>
          </button>
        </div>
      </div>

      {/* Action Sheet Menu Portal */}
      {createPortal(
        <div 
          className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Bottom Sheet */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-surface-elevated rounded-t-3xl border-t border-border shadow-2xl transition-transform duration-300 delay-75 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col pt-2 pb-safe ${isMenuOpen ? "translate-y-0" : "translate-y-full"}`}
          >
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <div className="px-6 pb-8 flex flex-col gap-2">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">إعدادات إضافية</h3>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-muted">
                <span className="font-medium text-text-primary">المظهر</span>
                <ThemeToggle />
              </div>

              {canInstall && (
                <button
                  onClick={() => {
                    promptInstall();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 transition-colors text-start"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                  </svg>
                  <span className="font-bold flex-1">تثبيت التطبيق</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-error/10 text-error hover:bg-error/20 transition-colors text-start mt-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span className="font-bold">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default MobileSidebar;
