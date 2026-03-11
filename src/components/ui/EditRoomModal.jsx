import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { updateRoomSchema } from "@/utils/validation";
import {
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
 * Edit Room Modal - Used by host to update room settings dynamically.
 */
function EditRoomModal({ isOpen, onClose, room }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallpaperPreview, setWallpaperPreview] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [roomSettings, setRoomSettings] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      theme: ROOM_THEMES.CLASSIC,
      ambientSound: AMBIENT_SOUNDS.NONE,
      isPublic: true,
      passCode: "",
      maxCapacity: 10,
      wallpaper: undefined,
    },
  });

  const isPublic = watch("isPublic");
  const watchedFields = watch();

  // Track if any field actually differs from original room
  const hasChanges = (() => {
    const source = roomSettings || room;
    if (!source) return false;
    const fieldsToCompare = [
      "name",
      "description",
      "theme",
      "ambientSound",
      "maxCapacity",
    ];
    for (const key of fieldsToCompare) {
      if (String(watchedFields[key] ?? "") !== String(source[key] ?? ""))
        return true;
    }
    if (watchedFields.isPublic !== (source.isPublic ?? true)) return true;
    if ((watchedFields.passCode || "") !== (source.passCode || "")) return true;
    if (watchedFields.wallpaper) return true;
    return false;
  })();

  // Fetch host-only settings (includes passCode) when modal opens
  // Skip if we already have cached settings for this room
  useEffect(() => {
    if (!isOpen || !room?.roomId) return;
    if (roomSettings?.roomId === room.roomId) return;
    let cancelled = false;

    async function fetchSettings() {
      setIsLoadingSettings(true);
      try {
        const res = await roomService.getSettings(room.roomId);
        if (cancelled) return;
        const settings = res.item || res.data || res;
        setRoomSettings(settings);
        reset({
          name: settings.name || "",
          description: settings.description || "",
          theme: settings.theme || ROOM_THEMES.CLASSIC,
          ambientSound: settings.ambientSound || AMBIENT_SOUNDS.NONE,
          isPublic: settings.isPublic ?? true,
          passCode: settings.passCode || "",
          maxCapacity: settings.maxCapacity || 10,
          wallpaper: undefined,
        });
        setWallpaperPreview(settings.wallPaperUrl || null);
      } catch {
        // Fallback to store room data if settings fetch fails
        setRoomSettings(null);
        reset({
          name: room.name || "",
          description: room.description || "",
          theme: room.theme || ROOM_THEMES.CLASSIC,
          ambientSound: room.ambientSound || AMBIENT_SOUNDS.NONE,
          isPublic: room.isPublic ?? true,
          passCode: "",
          maxCapacity: room.maxCapacity || 10,
          wallpaper: undefined,
        });
        setWallpaperPreview(room.wallPaperUrl || null);
      } finally {
        if (!cancelled) setIsLoadingSettings(false);
      }
    }

    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, [isOpen, room?.roomId, reset]);

  // Handle ESC or overlay click to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // ── File handling ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValue("wallpaper", file, { shouldValidate: true, shouldDirty: true });

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setWallpaperPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeWallpaper = () => {
    setValue("wallpaper", undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    // reset to current room wallpaper URL
    setWallpaperPreview(room?.wallPaperUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ──
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.passCode) delete payload.passCode;

      const changedData = {};

      // We only want to submit fields that actually changed
      for (const key of Object.keys(payload)) {
        if (key === "wallpaper" && payload[key]) {
          changedData[key] = payload[key];
        } else if (payload[key] !== room[key]) {
          changedData[key] = payload[key];
        }
      }

      // Check if anything actually changed
      if (Object.keys(changedData).length === 0) {
        onClose();
        return;
      }

      await roomService.update(room.id || room.roomId, changedData);

      setRoomSettings(null); // invalidate cache so next open re-fetches
      toast.success("تم تحديث إعدادات الغرفة بنجاح! 🎉");
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "فصل تحديث الغرفة. حاول مرة أخرى.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center isolate">
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10 animate-fade-in"
        onClick={onClose}
      />

      {/* ── Modal Content ── */}
      <div className="bg-surface-elevated border border-border flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-card overflow-hidden m-4 animate-scale-up">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between p-5 border-b border-border bg-surface-elevated/80 backdrop-blur-md">
          <h2 className="font-display text-xl font-bold text-text-primary">
            إعدادات الغرفة
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-muted transition-all cursor-pointer"
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
        </header>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit, (formErrors) =>
            console.error("Form validation errors:", formErrors),
          )}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar space-y-6">
            {isLoadingSettings ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-text-muted text-sm">
                  جاري تحميل الإعدادات...
                </p>
              </div>
            ) : (
              <>
                {/* ── Wallpaper Upload ── */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    صورة الخلفية
                  </label>

                  {wallpaperPreview ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-border shadow-card">
                      <img
                        src={wallpaperPreview}
                        alt="معاينة الخلفية"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white/90 text-gray-900 rounded-xl text-sm font-medium hover:bg-white transition-all cursor-pointer"
                        >
                          تغيير
                        </button>
                        {watch("wallpaper") && (
                          <button
                            type="button"
                            onClick={removeWallpaper}
                            className="px-4 py-2 bg-red-500/90 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-all cursor-pointer"
                          >
                            إلغاء التغيير
                          </button>
                        )}
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
                                shouldDirty: true,
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
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center gap-3 p-5 border-t border-border bg-surface-elevated/80 backdrop-blur-md">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting || !hasChanges}
              className="flex-1"
              size="lg"
            >
              حفظ التعديلات
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditRoomModal;
