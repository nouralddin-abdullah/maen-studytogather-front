import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { createRoomSchema } from "@/utils/validation";
import {
  ROUTES,
  ROOM_THEMES,
  AMBIENT_SOUNDS,
  AMBIENT_SOUND_LABELS,
} from "@/utils/constants";
import { roomService } from "@/services";
import { Button, Input, Select } from "@/components/ui";

// ── Theme options ──
const THEME_OPTIONS = [
  { value: ROOM_THEMES.CLASSIC, label: "🏛️ كلاسيكي" },
  { value: ROOM_THEMES.NIGHT_CITY, label: "🌃 مدينة ليلية" },
  { value: ROOM_THEMES.PINKY, label: "🌸 وردي" },
  { value: ROOM_THEMES.GITHUB, label: "🐙 GitHub" },
  { value: ROOM_THEMES.DARK, label: "🌑 داكن" },
  { value: ROOM_THEMES.GRAY, label: "🪨 رمادي" },
];

// ── Ambient sound options ──
const AMBIENT_OPTIONS = Object.values(AMBIENT_SOUNDS).map((v) => ({
  value: v,
  label: AMBIENT_SOUND_LABELS[v],
}));

// ── Visibility options ──
const VISIBILITY_OPTIONS = [
  { value: "true", label: "🌍 عامة — يمكن لأي شخص الانضمام" },
  { value: "false", label: "🔒 خاصة — بالدعوة فقط" },
];

/**
 * Create Room page — form to create a new study room.
 * Uses react-hook-form + Zod validation. Submits as multipart/form-data.
 * After creation, auto-navigates to the room.
 */
function CreateRoomPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallpaperPreview, setWallpaperPreview] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      theme: ROOM_THEMES.CLASSIC,
      ambientSound: AMBIENT_SOUNDS.NONE,
      isPublic: true,
      passCode: "",
      maxCapacity: 10,
      focusDuration: 25,
      breakDuration: 5,
      wallpaper: undefined,
    },
  });

  const isPublic = watch("isPublic");

  // ── File handling ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValue("wallpaper", file, { shouldValidate: true });

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setWallpaperPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeWallpaper = () => {
    setValue("wallpaper", undefined, { shouldValidate: true });
    setWallpaperPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ──
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Strip empty passCode
      const payload = { ...data };
      if (!payload.passCode) delete payload.passCode;

      const result = await roomService.create(payload);
      const inviteCode = result.createdItem?.inviteCode;

      if (inviteCode) {
        toast.success("تم إنشاء الغرفة بنجاح! 🎉");
        navigate(ROUTES.ROOM(inviteCode), {
          state: {
            roomPreview: {
              name: result.createdItem.name,
              hasPassCode: !!payload.passCode,
            },
          },
        });
      } else {
        toast.success("تم إنشاء الغرفة بنجاح!");
        navigate(ROUTES.DISCOVER);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "فشل إنشاء الغرفة. حاول مرة أخرى.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ══════ Header ══════ */}
      <header className="flex-shrink-0 flex items-center gap-4 bg-surface-elevated/80 backdrop-blur-xl border border-border p-3.5 rounded-2xl shadow-card">
        <button
          onClick={() => navigate(ROUTES.DISCOVER)}
          className="p-2 rounded-xl hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-all cursor-pointer"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h1 className="font-display text-lg font-bold text-text-primary">
          إنشاء غرفة جديدة
        </h1>
      </header>

      {/* ══════ Form ══════ */}
      <div className="flex-1 overflow-y-auto pe-1">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-2xl mx-auto space-y-6 py-4"
        >
          {/* ── Wallpaper Upload ── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">
              صورة الخلفية (اختياري)
            </label>

            {wallpaperPreview ? (
              <div className="relative group rounded-2xl overflow-hidden border border-border shadow-card">
                <img
                  src={wallpaperPreview}
                  alt="معاينة الخلفية"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/90 text-gray-900 rounded-xl text-sm font-medium hover:bg-white transition-all cursor-pointer"
                  >
                    تغيير
                  </button>
                  <button
                    type="button"
                    onClick={removeWallpaper}
                    className="px-4 py-2 bg-red-500/90 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-all cursor-pointer"
                  >
                    إزالة
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-border hover:border-brand-500 rounded-2xl flex flex-col items-center justify-center gap-2 text-text-muted hover:text-brand-600 transition-all cursor-pointer group"
              >
                <svg
                  className="w-10 h-10 group-hover:scale-110 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  اضغط لرفع صورة الخلفية
                </span>
                <span className="text-xs text-text-muted">
                  JPEG, PNG, WebP, GIF — حتى 10 ميجابايت
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            {errors.wallpaper && (
              <p className="text-xs text-error mt-1">
                {errors.wallpaper.message}
              </p>
            )}
          </div>

          {/* ── Name ── */}
          <Input
            label="اسم الغرفة"
            id="name"
            placeholder="مثال: غرفة مراجعة الفيزياء"
            error={errors.name?.message}
            {...register("name")}
          />

          {/* ── Description ── */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-text-secondary"
            >
              وصف الغرفة
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="وصف قصير عن الغرفة وأهدافها..."
              className="w-full px-4 py-2.5 rounded-xl border bg-surface-elevated text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 border-border hover:border-border-strong resize-none"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-error mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* ── Two columns: Theme + Ambient ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="ثيم الغرفة"
              id="theme"
              options={THEME_OPTIONS}
              placeholder="اختر الثيم"
              error={errors.theme?.message}
              {...register("theme")}
            />
            <Select
              label="صوت الخلفية"
              id="ambientSound"
              options={AMBIENT_OPTIONS}
              placeholder="اختر صوت"
              error={errors.ambientSound?.message}
              {...register("ambientSound")}
            />
          </div>

          {/* ── Two columns: Focus + Break Duration ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="مدة التركيز (دقائق)"
              id="focusDuration"
              type="number"
              min={5}
              max={360}
              error={errors.focusDuration?.message}
              {...register("focusDuration")}
            />
            <Input
              label="مدة الاستراحة (دقائق)"
              id="breakDuration"
              type="number"
              min={5}
              max={360}
              error={errors.breakDuration?.message}
              {...register("breakDuration")}
            />
          </div>

          {/* ── Visibility ── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">
              نوع الغرفة
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VISIBILITY_OPTIONS.map((opt) => {
                const checked = String(isPublic) === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 ring-2 ring-brand-500/30"
                        : "border-border hover:border-border-strong bg-surface-elevated"
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) =>
                        setValue("isPublic", e.target.value === "true", {
                          shouldValidate: true,
                        })
                      }
                      className="accent-brand-600"
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── PassCode (اختياري — لأي غرفة) ── */}
          <Input
            label="رمز الدخول (اختياري)"
            id="passCode"
            placeholder="رمز سري للانضمام"
            error={errors.passCode?.message}
            {...register("passCode")}
          />

          {/* ── Max Capacity ── */}
          <Input
            label="الحد الأقصى للمشاركين"
            id="maxCapacity"
            type="number"
            min={2}
            max={20}
            error={errors.maxCapacity?.message}
            {...register("maxCapacity")}
          />

          {/* ── Submit ── */}
          <div className="flex items-center gap-3 pt-2 pb-4">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
              size="lg"
            >
              <svg
                className="w-5 h-5 me-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              إنشاء الغرفة
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate(ROUTES.DISCOVER)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateRoomPage;
