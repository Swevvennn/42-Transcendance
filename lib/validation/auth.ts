import { z } from "zod"

// Shared between the client forms and (later) the server handlers, so the
// same rules apply on both sides. Messages are translation keys under
// `Validation.*` in messages/*.json.

export const loginSchema = z.object({
  email: z.email({ error: "emailInvalid" }),
  password: z.string().min(1, { error: "passwordRequired" }),
})

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, { error: "usernameLength" })
      .max(20, { error: "usernameLength" })
      .regex(/^[a-zA-Z0-9_]+$/, { error: "usernameChars" }),
    email: z.email({ error: "emailInvalid" }),
    password: z
      .string()
      .min(8, { error: "passwordLength" })
      .regex(/[a-zA-Z]/, { error: "passwordLetterDigit" })
      .regex(/[0-9]/, { error: "passwordLetterDigit" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "passwordMismatch",
    path: ["confirmPassword"],
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
