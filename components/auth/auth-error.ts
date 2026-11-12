// Turns a Better Auth error into a translation key.
// Field errors are keys under `Validation.*`, the others under `Auth.errors.*`.

import type { ValidationKey } from "@/lib/validation/auth"

export type AuthErrorKey =
  | "invalidCredentials"
  | "tooManyRequests"
  | "generic"
  | "invalidCode"
  | "invalidPassword"
  | "oauth42Unavailable"
  | "oauthFailed"
  | "sessionExpired"

type BetterAuthError = { code?: string; message?: string; status?: number }

export type AuthErrorResult =
  | { field: "username" | "email"; key: ValidationKey }
  | { field: null; kind: "validation"; key: ValidationKey }
  | { field: null; kind: "auth"; key: AuthErrorKey }

export function authError(error: BetterAuthError): AuthErrorResult {
  switch (error.code) {
    case "USERNAME_IS_ALREADY_TAKEN":
      return { field: "username", key: "usernameTaken" }
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return { field: "email", key: "emailTaken" }
    case "INVALID_EMAIL_OR_PASSWORD":
      return { field: null, kind: "auth", key: "invalidCredentials" }
    case "INVALID_CODE":
    case "INVALID_BACKUP_CODE":
      return { field: null, kind: "auth", key: "invalidCode" }
    case "INVALID_PASSWORD":
      return { field: null, kind: "auth", key: "invalidPassword" }
    case "ACCOUNT_TEMPORARILY_LOCKED":
    case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
      return { field: null, kind: "auth", key: "tooManyRequests" }
    case "INVALID_TWO_FACTOR_COOKIE":
      return { field: null, kind: "auth", key: "sessionExpired" }
    case "PROVIDER_NOT_FOUND":
      return { field: null, kind: "auth", key: "oauth42Unavailable" }
    case "VALIDATION_FAILED":
      // lib/auth.ts puts the Validation key in the message.
      return { field: null, kind: "validation", key: error.message as ValidationKey }
  }
  if (error.status === 429) return { field: null, kind: "auth", key: "tooManyRequests" }
  return { field: null, kind: "auth", key: "generic" }
}
