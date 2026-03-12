import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores";
import { registerStep2Schema } from "@/utils/validation";
import {
  FIELDS,
  FIELD_LABELS,
  SEX,
  SEX_LABELS,
  COUNTRIES,
  ROUTES,
} from "@/utils/constants";
import { Button, Select } from "@/components/ui";
import { apiClient, ENDPOINTS } from "@/api";

const FIELD_OPTIONS = Object.values(FIELDS).map((value) => ({
  value,
  label: FIELD_LABELS[value],
}));

const GENDER_OPTIONS = [
  { value: SEX.MALE, label: SEX_LABELS[SEX.MALE] },
  { value: SEX.FEMALE, label: SEX_LABELS[SEX.FEMALE] },
];

/**
 * Handles the OAuth callback.
 * If user is new, shows an onboarding modal. Otherwise, redirects to /discover.
 */
function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthLogin } = useAuthStore();
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: { country: "", gender: "", field: "" },
  });

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get("token");
      const isNewUser = searchParams.get("isNewUser") === "true";

      if (!token) {
        toast.error("حدث خطأ في المصادقة. لا يوجد توكن.");
        navigate(ROUTES.LOGIN);
        return;
      }

      try {
        await handleOAuthLogin(token);
        
        if (isNewUser) {
          setIsProcessing(false);
          setShowOnboarding(true);
        } else {
          toast.success("مرحباً بعودتك!");
          navigate(ROUTES.DISCOVER);
        }
      } catch (err) {
        toast.error("فشل تسجيل الدخول بواسطة Google");
        navigate(ROUTES.LOGIN);
      }
    };

    processCallback();
  }, [searchParams, navigate, handleOAuthLogin]);

  const onSaveDetails = async (data) => {
    setIsUpdating(true);
    const payload = {};
    if (data.country) payload.country = data.country.toUpperCase();
    if (data.gender) payload.gender = data.gender;
    if (data.field) payload.field = data.field;

    try {
      if (Object.keys(payload).length > 0) {
        await apiClient.patch(ENDPOINTS.USERS.UPDATE, payload);
        // Refresh local user data
        const updatedUser = await apiClient.get(ENDPOINTS.USERS.ME);
        localStorage.setItem("user", JSON.stringify(updatedUser.data));
        useAuthStore.setState({ user: updatedUser.data });
      }
      
      toast.success("تم إنشاء حسابك بنجاح! مرحباً بك 🎉");
      navigate(ROUTES.DISCOVER);
    } catch {
      toast.error("فشل حفظ البيانات. يمكنك تحديثها لاحقاً من ملفك الشخصي.");
      navigate(ROUTES.DISCOVER);
    } finally {
      setIsUpdating(false);
    }
  };

  const onSkip = () => {
    toast.success("تم إنشاء حسابك بنجاح! مرحباً بك 🎉");
    navigate(ROUTES.DISCOVER);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in relative z-10 w-full max-w-sm mx-auto">
      {isProcessing && !showOnboarding && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary font-medium animate-pulse">
            جاري معالجة تسجيل الدخول...
          </p>
        </div>
      )}

      {showOnboarding && (
        <div className="w-full bg-surface-elevated border border-border shadow-elevated rounded-2xl p-6 animate-slide-up relative">
          <div className="text-center mb-6">
            <h2 className="font-display text-2xl font-bold text-text-primary text-gradient mb-1">
              أهلاً بك! 🎉
            </h2>
            <p className="text-sm text-text-secondary">
              لقد تم إنشاء حسابك بنجاح. أكمل ملفك الشخصي (اختياري).
            </p>
          </div>

          <form onSubmit={handleSubmit(onSaveDetails)} className="space-y-4">
            <Select
              label="الجنس"
              id="gender"
              placeholder="👤  اختر الجنس"
              options={GENDER_OPTIONS}
              error={errors.gender?.message}
              {...register("gender")}
            />

            <Select
              label="التخصص"
              id="field"
              placeholder="📖  اختر تخصصك"
              options={FIELD_OPTIONS}
              error={errors.field?.message}
              {...register("field")}
            />

            <Select
              label="الدولة"
              id="country"
              placeholder="🌍  اختر دولتك"
              options={COUNTRIES}
              error={errors.country?.message}
              {...register("country")}
            />

            <div className="pt-2 flex flex-col gap-3">
              <Button type="submit" isLoading={isUpdating} className="w-full">
                حفظ والمتابعة
              </Button>
              <button
                type="button"
                onClick={onSkip}
                disabled={isUpdating}
                className="w-full text-center text-sm font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                تخطي — سأكمل لاحقاً
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AuthCallbackPage;
