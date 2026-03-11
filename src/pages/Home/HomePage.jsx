import { Link } from "react-router-dom";
import {
  APP_NAME,
  APP_TAGLINE,
  APP_DESCRIPTION,
  ROUTES,
} from "@/utils/constants";
import { useInstallPrompt } from "@/hooks";
import { useAuthStore } from "@/stores";

/**
 * Landing page — immersive hero with background gif, gradient overlay,
 * glass-card CTA and install prompt.
 */
function HomePage() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* -------- Background GIF -------- */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: "url('/background.gif')" }}
      />

      {/* -------- Gradient overlay -------- */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/85 to-surface/40 dark:from-surface dark:via-surface/90 dark:to-surface/50" />

      {/* -------- Subtle brand glow -------- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 start-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 dark:bg-brand-500/5 blur-[120px] rounded-full" />
      </div>

      {/* -------- Content -------- */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-16 max-w-2xl mx-auto">
        {/* Brand mark */}
        <img
          src="/pwa/StudyShell.png"
          alt={APP_NAME}
          className="w-20 h-20 sm:w-24 sm:h-24 mb-6 animate-fade-in object-contain"
        />

        {/* Heading */}
        <h1
          className="font-display text-5xl sm:text-7xl font-extrabold text-gradient mb-3 animate-fade-in"
          style={{ animationDelay: "0.05s" }}
        >
          {APP_NAME}
        </h1>

        {/* Tagline */}
        <p
          className="text-xl sm:text-2xl font-medium text-text-primary mb-2 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          {APP_TAGLINE}
        </p>

        {/* Description */}
        <p
          className="text-base text-text-secondary mb-10 max-w-md animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          {APP_DESCRIPTION}
        </p>

        {/* CTA buttons */}
        <div
          className="flex gap-3 flex-wrap justify-center animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          {isAuthenticated ? (
            <Link
              to={ROUTES.DISCOVER}
              className="bg-brand-600 text-white px-8 py-3.5 rounded-2xl text-lg font-semibold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/25 transition-all duration-200"
            >
              اكتشف الغرف
            </Link>
          ) : (
            <>
              <Link
                to={ROUTES.REGISTER}
                className="bg-brand-600 text-white px-8 py-3.5 rounded-2xl text-lg font-semibold hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/25 transition-all duration-200"
              >
                ابدأ الآن
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="bg-surface-elevated/60 backdrop-blur-md border border-border text-text-primary px-8 py-3.5 rounded-2xl text-lg font-semibold hover:bg-surface-elevated/90 transition-all duration-200"
              >
                تسجيل الدخول
              </Link>
            </>
          )}
        </div>

        {/* Install PWA — contextual, disappears when installed */}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="mt-8 inline-flex items-center gap-2 bg-surface-elevated/50 backdrop-blur-lg border border-border/60 text-text-secondary px-5 py-2.5 rounded-xl text-sm font-medium hover:text-brand-600 hover:border-brand-500/40 transition-all duration-200 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25"
              />
            </svg>
            تثبيت التطبيق
          </button>
        )}
      </div>
    </section>
  );
}

export default HomePage;
