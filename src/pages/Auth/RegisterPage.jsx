import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores";
import { registerStep1Schema, registerStep2Schema } from "@/utils/validation";
import {
  FIELDS,
  FIELD_LABELS,
  SEX,
  SEX_LABELS,
  COUNTRIES,
  APP_NAME,
  ROUTES,
} from "@/utils/constants";
import { API_BASE_URL } from "@/api";
import { Button, Input, Select, Stepper } from "@/components/ui";

const STEPS = [{ label: "بيانات الحساب" }, { label: "معلومات إضافية" }];

const FIELD_OPTIONS = Object.values(FIELDS).map((value) => ({
  value,
  label: FIELD_LABELS[value],
}));

const GENDER_OPTIONS = [
  { value: SEX.MALE, label: SEX_LABELS[SEX.MALE] },
  { value: SEX.FEMALE, label: SEX_LABELS[SEX.FEMALE] },
];

/**
 * Multi-step registration page.
 * Step 1: email, username, password, nickname (required)
 * Step 2: country, gender, field (optional)
 */
function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState(null);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // ── Step 1 form ────────────────────────────────
  const step1Form = useForm({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: { email: "", username: "", password: "", nickName: "" },
  });

  // ── Step 2 form ────────────────────────────────
  const step2Form = useForm({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: { country: "", gender: "", field: "" },
  });

  const handleStep1Submit = (data) => {
    setStep1Data(data);
    setCurrentStep(1);
  };

  const handleStep2Submit = async (data) => {
    // Merge step 1 + step 2, strip empty optional fields
    const payload = { ...step1Data };

    if (data.country) payload.country = data.country.toUpperCase();
    if (data.gender) payload.gender = data.gender;
    if (data.field) payload.field = data.field;

    try {
      await registerUser(payload);
      toast.success("تم إنشاء حسابك بنجاح! مرحباً بك 🎉");
      navigate(ROUTES.DISCOVER);
    } catch {
      toast.error("فشل إنشاء الحساب. حاول مرة أخرى.");
    }
  };

  const handleGoBack = () => {
    setCurrentStep(0);
  };

  return (
    <div className="animate-fade-in">
      {/* Mobile branding */}
      <div className="lg:hidden text-center mb-6">
        <h1 className="font-display text-4xl font-bold text-gradient">
          {APP_NAME}
        </h1>
      </div>

      <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
        إنشاء حساب جديد
      </h2>
      <p className="text-text-secondary mb-6">
        {currentStep === 0
          ? "أدخل بياناتك الأساسية"
          : "أكمل ملفك الشخصي (اختياري)"}
      </p>

      {/* Stepper */}
      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(step) => step < currentStep && setCurrentStep(step)}
      />

      {/* ── Step 1: Account Basics ── */}
      {currentStep === 0 && (
        <form
          onSubmit={step1Form.handleSubmit(handleStep1Submit)}
          className="space-y-4 animate-fade-in"
        >
          <Input
            label="البريد الإلكتروني"
            id="email"
            type="email"
            placeholder="example@email.com"
            dir="ltr"
            className="text-left"
            error={step1Form.formState.errors.email?.message}
            {...step1Form.register("email")}
          />

          <Input
            label="اسم المستخدم"
            id="username"
            type="text"
            placeholder="ahmed_123"
            dir="ltr"
            className="text-left"
            error={step1Form.formState.errors.username?.message}
            {...step1Form.register("username")}
          />

          <Input
            label="الاسم المستعار"
            id="nickName"
            type="text"
            placeholder="أحمد"
            error={step1Form.formState.errors.nickName?.message}
            {...step1Form.register("nickName")}
          />

          <Input
            label="كلمة المرور"
            id="password"
            type="password"
            placeholder="••••••••"
            dir="ltr"
            className="text-left"
            error={step1Form.formState.errors.password?.message}
            {...step1Form.register("password")}
          />

          <Button type="submit" className="w-full mt-2">
            التالي
          </Button>

          <div className="relative my-5">
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
        </form>
      )}

      {/* ── Step 2: Profile Details ── */}
      {currentStep === 1 && (
        <form
          onSubmit={step2Form.handleSubmit(handleStep2Submit)}
          className="space-y-4 animate-fade-in"
        >
          <Select
            label="الجنس"
            id="gender"
            placeholder="👤  اختر الجنس"
            options={GENDER_OPTIONS}
            error={step2Form.formState.errors.gender?.message}
            {...step2Form.register("gender")}
          />

          <Select
            label="التخصص"
            id="field"
            placeholder="📖  اختر تخصصك"
            options={FIELD_OPTIONS}
            error={step2Form.formState.errors.field?.message}
            {...step2Form.register("field")}
          />

          <Select
            label="الدولة"
            id="country"
            placeholder="🌍  اختر دولتك"
            options={COUNTRIES}
            error={step2Form.formState.errors.country?.message}
            {...step2Form.register("country")}
          />

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGoBack}
              className="flex-1"
            >
              رجوع
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              إنشاء الحساب
            </Button>
          </div>

          <button
            type="button"
            onClick={() => handleStep2Submit({})}
            className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            تخطي — سأكمل لاحقاً
          </button>
        </form>
      )}

      <p className="text-center text-sm text-text-secondary mt-6">
        لديك حساب بالفعل؟{" "}
        <Link
          to={ROUTES.LOGIN}
          className="text-brand-600 font-medium hover:underline"
        >
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
