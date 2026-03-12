import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { loginSchema } from "@/utils/validation";
import { Button, Input } from "@/components/ui";
import { API_BASE_URL } from "@/api";
import { APP_NAME, ROUTES } from "@/utils/constants";

/**
 * Login page — email + password form.
 */
function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success("مرحباً بعودتك!");
      navigate(ROUTES.DISCOVER);
    } catch {
      toast.error("فشل تسجيل الدخول. تحقق من بياناتك.");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Mobile branding */}
      <div className="lg:hidden text-center mb-8">
        <h1 className="font-display text-4xl font-bold text-gradient">
          {APP_NAME}
        </h1>
      </div>

      <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
        تسجيل الدخول
      </h2>
      <p className="text-text-secondary mb-8">أدخل بياناتك للمتابعة</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="البريد الإلكتروني أو اسم المستخدم"
          id="loginIdentifier"
          type="text"
          placeholder="example@email.com أو ahmed_123"
          dir="ltr"
          className="text-left"
          error={errors.loginIdentifier?.message}
          {...register("loginIdentifier")}
        />

        <Input
          label="كلمة المرور"
          id="password"
          type="password"
          placeholder="••••••••"
          dir="ltr"
          className="text-left"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          تسجيل الدخول
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-text-muted">أو</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => (window.location.href = `${API_BASE_URL}/users/auth/google`)}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text-primary font-medium transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        المتابعة باستخدام Google
      </button>

      <p className="text-center text-sm text-text-secondary mt-6">
        ليس لديك حساب؟{" "}
        <Link
          to={ROUTES.REGISTER}
          className="text-brand-600 font-medium hover:underline"
        >
          إنشاء حساب جديد
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
