import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { APP_NAME, ROUTES } from "@/utils/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";

/**
 * Sidebar item — renders a Link or a button depending on props.
 */
function SidebarItem({ to, onClick, icon, label, isActive, badge }) {
  const inner = (
    <>
      {icon}
      {/* Badge */}
      {badge > 0 && (
        <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-600 text-white text-[10px] font-bold px-1 leading-none">
          {badge}
        </span>
      )}
      {/* Tooltip */}
      <span className="absolute start-full ms-3 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-xs font-medium text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-elevated z-[100]">
        {label}
      </span>
    </>
  );

  const classes = `relative group w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
    isActive
      ? "bg-brand-600/15 text-brand-600 border border-brand-500/30"
      : "hover:bg-surface-muted text-text-muted hover:text-text-primary"
  }`;

  if (onClick) {
    return (
      <button onClick={onClick} title={label} className={`${classes} cursor-pointer`}>
        {inner}
      </button>
    );
  }

  return (
    <Link to={to} title={label} className={classes}>
      {inner}
    </Link>
  );
}

/**
 * App sidebar — narrow icon-based navigation for the discover layout.
 */
function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const navItems = [
    {
      to: ROUTES.DISCOVER,
      label: "اكتشف",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
      ),
    },
    {
      to: ROUTES.FRIENDS,
      label: "أصدقائي",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
    },
    {
      to: "#",
      label: "الإحصائيات",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-[72px] flex-shrink-0 flex flex-col items-center gap-5 py-5 bg-surface-elevated/80 backdrop-blur-xl border border-border rounded-2xl shadow-elevated z-40">
      {/* Logo */}
      <Link
        to={ROUTES.HOME}
        className="font-display text-xl font-bold text-gradient mb-2"
        title={APP_NAME}
      >
        {APP_NAME}
      </Link>

      {/* Divider */}
      <div className="w-8 h-px bg-border" />

      {/* Nav items */}
      <nav className="flex flex-col gap-2.5 items-center">
        {navItems.map((item) => (
          <SidebarItem
            key={item.label}
            to={item.to}
            onClick={item.onClick}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            isActive={location.pathname === item.to}
          />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-3 items-center">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="خروج"
          className="group relative w-11 h-11 flex items-center justify-center rounded-xl text-text-muted hover:bg-error/10 hover:text-error transition-all cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          <span className="absolute start-full ms-3 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-xs font-medium text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-elevated z-[100]">
            خروج
          </span>
        </button>

        {/* Divider */}
        <div className="w-8 h-px bg-border" />

        {/* User avatar */}
        <Link to={ROUTES.MY_PROFILE} className="group relative">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.nickName}
              className="w-9 h-9 rounded-full border border-border object-cover hover:border-brand-500 transition-colors"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 border border-border hover:border-brand-500 flex items-center justify-center transition-colors">
              <span className="text-sm font-bold text-brand-600">
                {(user?.nickName || user?.username || "م").charAt(0)}
              </span>
            </div>
          )}
          <span className="absolute start-full ms-3 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-xs font-medium text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-elevated z-[100]">
            {user?.nickName || user?.username || "المستخدم"}
          </span>
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;

