import { Link } from "react-router-dom";
import { APP_NAME, APP_TAGLINE, ROUTES } from "@/utils/constants";

/**
 * Landing page — placeholder, will be designed later.
 */
function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="font-display text-5xl sm:text-7xl font-bold text-gradient mb-4 animate-fade-in">
        {APP_NAME}
      </h1>
      <p
        className="text-xl text-text-secondary mb-8 animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        {APP_TAGLINE}
      </p>
      <div
        className="flex gap-4 animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        <Link
          to={ROUTES.REGISTER}
          className="bg-brand-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-brand-700 transition-colors"
        >
          ابدأ الآن
        </Link>
        <Link
          to={ROUTES.LOGIN}
          className="border border-border text-text-primary px-8 py-3 rounded-xl text-lg font-medium hover:bg-surface-muted transition-colors"
        >
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
