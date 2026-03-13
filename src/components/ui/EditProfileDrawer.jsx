import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editProfileSchema } from "@/utils/validation";
import { userService, authService } from "@/services";
import { useAuthStore } from "@/stores";
import { COUNTRIES, FIELDS, FIELD_LABELS, SEX } from "@/utils/constants";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";

/**
 * Maximum interests tags a user can have.
 */
const MAX_INTERESTS = 10;

/**
 * Camera overlay icon used on avatar & cover.
 */
function CameraOverlay({ className }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${className}`}
    >
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
        />
      </svg>
    </div>
  );
}

/**
 * Section divider with title.
 */
function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider pb-2 border-b border-border">
      {children}
    </h3>
  );
}

/**
 * EditProfileDrawer — Full slide-over panel for editing user profile.
 *
 * Props:
 *   isOpen — controls visibility
 *   onClose — callback to close drawer
 *   profile — current user profile data
 *   onUpdated — callback after successful update (receives new profile)
 */
function EditProfileDrawer({ isOpen, onClose, profile, onUpdated }) {
  const backdropRef = useRef(null);
  const drawerRef = useRef(null);

  // ── Image uploads state ──
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const bgInputRef = useRef(null);

  // ── Interests tag input ──
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState("");
  const interestInputRef = useRef(null);

  // ── Submit state ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Form ──
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: "",
      nickName: "",
      country: "",
      gender: "",
      field: "",
      quote: "",
      discordUsername: "",
      twitterUrl: "",
    },
  });

  const quoteValue = watch("quote");

  // ── Populate form when profile changes ──
  useEffect(() => {
    if (profile && isOpen) {
      reset({
        username: profile.username || "",
        nickName: profile.nickName || "",
        country: profile.country || "",
        gender: profile.gender || "",
        field: profile.field || "",
        quote: profile.quote || "",
        discordUsername: profile.discordUsername || "",
        twitterUrl: profile.twitterUrl || "",
      });
      setInterests(profile.interests || []);
      setAvatarFile(null);
      setAvatarPreview(null);
      setBgFile(null);
      setBgPreview(null);
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [profile, isOpen, reset]);

  // ── Close on Escape ──
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Lock body scroll ──
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Image handlers ──
  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

  const handleBgChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgFile(file);
    setBgPreview(URL.createObjectURL(file));
  }, []);

  // ── Interests handlers ──
  const addInterest = useCallback(() => {
    const trimmed = interestInput.trim();
    if (!trimmed) return;
    if (interests.length >= MAX_INTERESTS) return;
    if (interests.includes(trimmed)) return;
    setInterests((prev) => [...prev, trimmed]);
    setInterestInput("");
  }, [interestInput, interests]);

  const removeInterest = useCallback((tag) => {
    setInterests((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleInterestKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addInterest();
      }
      if (
        e.key === "Backspace" &&
        interestInput === "" &&
        interests.length > 0
      ) {
        setInterests((prev) => prev.slice(0, -1));
      }
    },
    [addInterest, interestInput, interests],
  );

  // ── Submit ──
  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Build the data payload — only send changed or filled fields
      const payload = {};

      // Text fields — always send
      payload.username = formData.username;
      payload.nickName = formData.nickName;

      // Nullable fields — send empty string as null to backend
      payload.country = formData.country || null;
      payload.gender = formData.gender || null;
      payload.field = formData.field || null;
      payload.quote = formData.quote || null;
      payload.discordUsername = formData.discordUsername || null;
      payload.twitterUrl = formData.twitterUrl || null;
      payload.interests = interests.length > 0 ? interests : null;

      await userService.updateMe(payload, avatarFile, bgFile);

      // Refresh auth user data (so navbar avatar, chat, etc. all update)
      const refreshed = await authService.getMe();
      useAuthStore.getState().setUser(refreshed);

      setSubmitSuccess(true);

      // Notify parent to refresh the profile
      onUpdated?.(refreshed);

      // Auto-close after brief success indication
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      const msg =
        err.response?.data?.message || "فشل تحديث الملف الشخصي. حاول مرة أخرى.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived ──
  const currentAvatar = avatarPreview || profile?.avatar || null;
  const currentBg =
    bgPreview ||
    profile?.profileBackgroundUrl ||
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80";

  const hasChanges =
    isDirty ||
    avatarFile !== null ||
    bgFile !== null ||
    JSON.stringify(interests) !== JSON.stringify(profile?.interests || []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-drawer-backdrop"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 start-0 z-50 w-full max-w-lg bg-surface border-e border-border shadow-2xl flex flex-col animate-drawer-slide-in"
        role="dialog"
        aria-modal="true"
        aria-label="تعديل الملف الشخصي"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══════ Header ══════ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-display font-bold text-text-primary">
            تعديل الملف الشخصي
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-muted text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ══════ Scrollable Body ══════ */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto"
        >
          <div className="p-6 space-y-8">
            {/* ── Cover & Avatar ── */}
            <div className="space-y-4">
              <SectionTitle>الصور</SectionTitle>

              {/* Background cover */}
              <div
                className="group relative h-36 rounded-xl overflow-hidden cursor-pointer border border-border"
                onClick={() => bgInputRef.current?.click()}
              >
                <img
                  src={currentBg}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <CameraOverlay className="rounded-xl" />
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgChange}
                />
                <span className="absolute bottom-2 start-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-md">
                  صورة الغلاف
                </span>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div
                  className="group relative w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 border-border flex-shrink-0"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-2xl font-bold text-brand-600">
                        {(profile?.nickName || profile?.username || "م").charAt(
                          0,
                        )}
                      </span>
                    </div>
                  )}
                  <CameraOverlay className="rounded-full" />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="text-xs text-text-muted space-y-0.5">
                  <p>اضغط لتغيير الصورة الشخصية</p>
                  <p>PNG, JPG — حتى 5 ميجابايت</p>
                </div>
              </div>
            </div>

            {/* ── Basic Info ── */}
            <div className="space-y-4">
              <SectionTitle>المعلومات الأساسية</SectionTitle>

              <Input
                label="اسم المستخدم"
                id="edit-username"
                dir="ltr"
                className="text-start"
                placeholder="username"
                error={errors.username?.message}
                {...register("username")}
              />

              <Input
                label="الاسم المستعار"
                id="edit-nickName"
                placeholder="الاسم المعروض"
                error={errors.nickName?.message}
                {...register("nickName")}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="الجنس"
                  id="edit-gender"
                  placeholder="اختر..."
                  options={[
                    { value: SEX.MALE, label: "👨  ذكر" },
                    { value: SEX.FEMALE, label: "👩  أنثى" },
                  ]}
                  error={errors.gender?.message}
                  {...register("gender")}
                />

                <Select
                  label="الدولة"
                  id="edit-country"
                  placeholder="اختر..."
                  options={COUNTRIES}
                  error={errors.country?.message}
                  {...register("country")}
                />
              </div>

              <Select
                label="التخصص"
                id="edit-field"
                placeholder="اختر تخصصك..."
                options={Object.entries(FIELDS).map(([key, val]) => ({
                  value: val,
                  label: FIELD_LABELS[key] || key,
                }))}
                error={errors.field?.message}
                {...register("field")}
              />
            </div>

            {/* ── Personal ── */}
            <div className="space-y-4">
              <SectionTitle>عنك</SectionTitle>

              {/* Quote with char counter */}
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-quote"
                  className="block text-sm font-medium text-text-secondary"
                >
                  اقتباس
                </label>
                <textarea
                  id="edit-quote"
                  dir="auto"
                  rows={3}
                  maxLength={200}
                  placeholder="اكتب اقتباسك المفضل..."
                  className="w-full px-4 py-2.5 rounded-xl border bg-surface-elevated text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 border-border hover:border-border-strong resize-none"
                  {...register("quote")}
                />
                <div className="flex justify-between">
                  {errors.quote?.message && (
                    <p className="text-xs text-error">{errors.quote.message}</p>
                  )}
                  <span
                    className={`text-xs ms-auto ${
                      (quoteValue?.length || 0) > 180
                        ? "text-error"
                        : "text-text-muted"
                    }`}
                  >
                    {quoteValue?.length || 0}/200
                  </span>
                </div>
              </div>

              {/* Interests tag input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">
                  الاهتمامات
                  <span className="text-text-muted font-normal me-1">
                    ({interests.length}/{MAX_INTERESTS})
                  </span>
                </label>
                <div
                  className="flex flex-wrap gap-2 p-3 rounded-xl border bg-surface-elevated border-border hover:border-border-strong transition-colors min-h-[44px] cursor-text focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500"
                  onClick={() => interestInputRef.current?.focus()}
                >
                  {interests.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-1 bg-brand-500/10 text-brand-600 rounded-lg text-sm font-medium border border-brand-500/20 animate-fade-in"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeInterest(tag);
                        }}
                        className="hover:text-error transition-colors cursor-pointer"
                        aria-label={`إزالة ${tag}`}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {interests.length < MAX_INTERESTS && (
                    <input
                      ref={interestInputRef}
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={handleInterestKeyDown}
                      onBlur={addInterest}
                      placeholder={
                        interests.length === 0
                          ? "أضف اهتماماتك... (Enter لإضافة)"
                          : "أضف المزيد..."
                      }
                      className="flex-1 min-w-[120px] bg-transparent text-text-primary placeholder:text-text-muted text-sm outline-none"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── Social Links ── */}
            <div className="space-y-4">
              <SectionTitle>التواصل الاجتماعي</SectionTitle>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-discord"
                  className="block text-sm font-medium text-text-secondary"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-[#5865F2]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                    </svg>
                    Discord
                  </span>
                </label>
                <input
                  id="edit-discord"
                  dir="ltr"
                  placeholder="username"
                  className="w-full px-4 py-2.5 rounded-xl border bg-surface-elevated text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 border-border hover:border-border-strong text-start"
                  {...register("discordUsername")}
                />
                {errors.discordUsername?.message && (
                  <p className="text-xs text-error">
                    {errors.discordUsername.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-twitter"
                  className="block text-sm font-medium text-text-secondary"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X / Twitter
                  </span>
                </label>
                <input
                  id="edit-twitter"
                  dir="ltr"
                  placeholder="https://x.com/username"
                  className="w-full px-4 py-2.5 rounded-xl border bg-surface-elevated text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 border-border hover:border-border-strong text-start"
                  {...register("twitterUrl")}
                />
                {errors.twitterUrl?.message && (
                  <p className="text-xs text-error">
                    {errors.twitterUrl.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ══════ Footer ══════ */}
          <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex items-center gap-3 flex-shrink-0">
            {submitError && (
              <p className="text-xs text-error flex-1">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-xs text-brand-600 flex-1 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                تم التحديث بنجاح
              </p>
            )}
            {!submitError && !submitSuccess && <div className="flex-1" />}

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!hasChanges && !isSubmitting}
            >
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export default EditProfileDrawer;
