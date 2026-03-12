import { z } from "zod";
import { FIELDS, SEX, ROOM_THEMES, AMBIENT_SOUNDS } from "./constants";

/**
 * Validation schemas for forms.
 * Mirrors the backend DTO — Arabic messages for UX.
 */

export const loginSchema = z.object({
  loginIdentifier: z.string().min(1, "البريد الإلكتروني أو اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

/**
 * Step 1 — Account basics.
 */
export const registerStep1Schema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح"),
  username: z
    .string()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(20, "اسم المستخدم يجب أن يكون 20 حرف كحد أقصى")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "اسم المستخدم يمكن أن يحتوي على أحرف وأرقام و _ فقط",
    ),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(50, "كلمة المرور يجب أن تكون 50 حرف كحد أقصى"),
  nickName: z
    .string()
    .min(2, "الاسم المستعار يجب أن يكون حرفين على الأقل")
    .max(50, "الاسم المستعار طويل جداً"),
});

/**
 * Step 2 — Profile details (all optional).
 */
export const registerStep2Schema = z.object({
  country: z
    .string()
    .length(2, "رمز الدولة يجب أن يكون حرفين")
    .toUpperCase()
    .optional()
    .or(z.literal("")),
  gender: z
    .enum([SEX.MALE, SEX.FEMALE], { message: "الجنس يجب أن يكون ذكر أو أنثى" })
    .optional()
    .or(z.literal("")),
  field: z
    .enum(Object.values(FIELDS), {
      message: "التخصص يجب أن يكون من القائمة المتاحة",
    })
    .optional()
    .or(z.literal("")),
});

/**
 * Edit profile schema — mirrors backend UpdateUserDTO with Arabic messages.
 */
export const editProfileSchema = z.object({
  username: z
    .string()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(20, "اسم المستخدم يجب أن يكون 20 حرف كحد أقصى")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "اسم المستخدم يمكن أن يحتوي على أحرف وأرقام و _ فقط",
    ),
  nickName: z
    .string()
    .min(2, "الاسم المستعار يجب أن يكون حرفين على الأقل")
    .max(50, "الاسم المستعار طويل جداً"),
  country: z
    .string()
    .length(2, "رمز الدولة يجب أن يكون حرفين")
    .toUpperCase()
    .optional()
    .or(z.literal("")),
  gender: z
    .enum([SEX.MALE, SEX.FEMALE], { message: "الجنس يجب أن يكون ذكر أو أنثى" })
    .optional()
    .or(z.literal("")),
  field: z
    .enum(Object.values(FIELDS), {
      message: "التخصص يجب أن يكون من القائمة المتاحة",
    })
    .optional()
    .or(z.literal("")),
  quote: z
    .string()
    .max(200, "الاقتباس يجب أن يكون 200 حرف كحد أقصى")
    .optional()
    .or(z.literal("")),
  discordUsername: z
    .string()
    .max(50, "اسم Discord يجب أن يكون 50 حرف كحد أقصى")
    .optional()
    .or(z.literal("")),
  twitterUrl: z
    .string()
    .url("يجب أن يكون رابط صالح")
    .optional()
    .or(z.literal("")),
});

/**
 * Create room schema — mirrors backend CreateRoomDTO with Arabic messages.
 */
export const createRoomSchema = z
  .object({
    name: z
      .string()
      .min(1, "اسم الغرفة يجب أن يكون حرفاً واحداً على الأقل")
      .max(100, "اسم الغرفة يجب أن يكون 100 حرف كحد أقصى"),
    description: z
      .string()
      .min(1, "وصف الغرفة يجب أن يكون حرفاً واحداً على الأقل")
      .max(500, "وصف الغرفة يجب أن يكون 500 حرف كحد أقصى")
      .optional()
      .or(z.literal("")),
    theme: z
      .enum(Object.values(ROOM_THEMES), {
        message: "اختر ثيم صالح",
      })
      .optional(),
    ambientSound: z
      .enum(Object.values(AMBIENT_SOUNDS), {
        message: "اختر صوت محيط صالح",
      })
      .optional(),
    isPublic: z.boolean().optional().default(true),
    passCode: z
      .string()
      .min(3, "رمز الدخول يجب أن يكون 3 أحرف على الأقل")
      .max(15, "رمز الدخول يجب أن يكون 15 حرف كحد أقصى")
      .optional()
      .or(z.literal("")),
    maxCapacity: z.coerce
      .number()
      .int()
      .min(2, "الحد الأقصى يجب أن يكون 2 على الأقل")
      .max(20, "الحد الأقصى يجب أن يكون 20 كحد أقصى")
      .optional()
      .default(10),
    focusDuration: z.coerce
      .number()
      .int()
      .min(5, "مدة التركيز 5 دقائق على الأقل")
      .max(360, "مدة التركيز 360 دقيقة كحد أقصى"),
    breakDuration: z.coerce
      .number()
      .int()
      .min(5, "مدة الاستراحة 5 دقائق على الأقل")
      .max(360, "مدة الاستراحة 360 دقيقة كحد أقصى"),
    wallpaper: z
      .instanceof(File, { message: "صورة الخلفية غير صالحة" })
      .refine((f) => f.size <= 10 * 1024 * 1024, "حجم الملف يجب أن يكون أقل من 10 ميجابايت")
      .refine(
        (f) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type),
        "الصيغة يجب أن تكون JPEG أو PNG أو WebP أو GIF"
      )
      .optional()
      .nullable(),
  })
  .refine((data) => {
    // If room is not public and passCode is provided, that's fine
    // If room is not public, passCode is optional per backend
    return true;
  }, {});

/**
 * Update room schema — mirrors backend UpdateRoomDto with Arabic messages.
 */
export const updateRoomSchema = z.object({
  name: z
    .string()
    .min(1, "اسم الغرفة يجب أن يكون حرفاً واحداً على الأقل")
    .max(100, "اسم الغرفة يجب أن يكون 100 حرف كحد أقصى")
    .optional(),
  description: z
    .string()
    .min(1, "وصف الغرفة يجب أن يكون حرفاً واحداً على الأقل")
    .max(500, "وصف الغرفة يجب أن يكون 500 حرف كحد أقصى")
    .optional()
    .or(z.literal("")),
  theme: z
    .enum(Object.values(ROOM_THEMES), {
      message: "اختر ثيم صالح",
    })
    .optional(),
  ambientSound: z
    .enum(Object.values(AMBIENT_SOUNDS), {
      message: "اختر صوت محيط صالح",
    })
    .optional(),
  isPublic: z.boolean().optional(),
  passCode: z
    .string()
    .min(3, "رمز الدخول يجب أن يكون 3 أحرف على الأقل")
    .max(15, "رمز الدخول يجب أن يكون 15 حرف كحد أقصى")
    .optional()
    .or(z.literal("")),
  maxCapacity: z.coerce
    .number()
    .int()
    .min(2, "الحد الأقصى يجب أن يكون 2 على الأقل")
    .max(20, "الحد الأقصى يجب أن يكون 20 كحد أقصى")
    .optional(),
  wallpaper: z
    .instanceof(File, { message: "صورة الخلفية غير صالحة" })
    .refine((f) => f.size > 0, "مطلوب ملف صورة")
    .refine(
      (f) => f.size <= 10 * 1024 * 1024,
      "حجم الملف يجب أن يكون أقل من 10 ميجابايت",
    )
    .refine(
      (f) =>
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type),
      "الصيغة يجب أن تكون JPEG أو PNG أو WebP أو GIF",
    )
    .optional()
    .or(z.literal("")),
});
