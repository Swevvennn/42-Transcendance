"use client"

import { useTranslations } from "next-intl"

import type { AuthErrorResult } from "@/components/auth/auth-error"

/** A form-level error (not tied to one field), translated. */
export function FormAlert({ error }: { error: AuthErrorResult | null }) {
  const t = useTranslations("Auth.errors")
  const tv = useTranslations("Validation")
  if (!error || error.field) return null

  return (
    <p role="alert" className="text-sm text-destructive">
      {error.kind === "validation" ? tv(error.key) : t(error.key)}
    </p>
  )
}
