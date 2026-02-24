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
