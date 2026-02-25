import { z } from "zod";
import { FIELDS, SEX } from "./constants";

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
