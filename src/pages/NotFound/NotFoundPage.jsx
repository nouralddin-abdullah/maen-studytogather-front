import { Link } from "react-router-dom";
import { ROUTES } from "@/utils/constants";

/**
 * 404 — Not Found page.
 */
function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-surface"
      dir="rtl"
    >
      <h1 className="font-display text-8xl font-bold text-gradient mb-4">
        404
      </h1>
      <p className="text-xl text-text-secondary mb-8">
        الصفحة التي تبحث عنها غير موجودة
      </p>
      <Link
        to={ROUTES.HOME}
        className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}

export default NotFoundPage;
