import { z } from "zod"

// Shared between the client forms and the server (lib/auth.ts), so the
// same rules apply on both sides. Messages are translation keys under
// `Validation.*` in messages/*.json.

export const loginSchema = z.object({
  email: z.email({ error: "emailInvalid" }),
  password: z.string().min(1, { error: "passwordRequired" }),
})

/** A username: also used for friend requests (lib/friends/actions.ts). */
export const usernameSchema = z
  .string()
  .min(3, { error: "usernameLength" })
  .max(20, { error: "usernameLength" })
  .regex(/^[a-zA-Z0-9_]+$/, { error: "usernameChars" })

/** What the browser sends to the server at sign-up (checked by lib/auth.ts). */
export const signupApiSchema = z.object({
  username: usernameSchema,
  email: z.email({ error: "emailInvalid" }),
  password: z
    .string()
    .min(8, { error: "passwordLength" })
    .max(128, { error: "passwordLength" })
    .regex(/[a-zA-Z]/, { error: "passwordLetterDigit" })
    .regex(/[0-9]/, { error: "passwordLetterDigit" }),
})

/** The sign-up form: the same fields + the password confirmation. */
export const signupSchema = signupApiSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    error: "passwordMismatch",
    path: ["confirmPassword"],
  })

/** 2FA: the 6 digits of the authenticator app. */
export const totpCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, { error: "codeFormat" }),
})

/** 2FA: a backup code (format chosen by Better Auth, so only "not empty"). */
export const backupCodeSchema = z.object({
  code: z.string().trim().min(1, { error: "codeRequired" }).max(64, { error: "codeRequired" }),
})

/** Password confirmation (enable / disable 2FA). */
export const passwordConfirmSchema = z.object({
  password: z.string().min(1, { error: "passwordRequired" }).max(128, { error: "passwordRequired" }),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>

export type ValidationKey =
  | "emailInvalid"
  | "passwordRequired"
  | "usernameLength"
  | "usernameChars"
  | "passwordLength"
  | "passwordLetterDigit"
  | "passwordMismatch"
  | "usernameTaken"
  | "emailTaken"
  | "tournamentNameLength"
  | "tournamentSize"
  | "codeFormat"
  | "codeRequired"
