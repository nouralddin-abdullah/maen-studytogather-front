import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { loginSchema } from "@/utils/validation";
import { Button, Input } from "@/components/ui";
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
