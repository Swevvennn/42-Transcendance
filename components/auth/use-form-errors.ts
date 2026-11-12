"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import type { z } from "zod"

import type { ValidationKey } from "@/lib/validation/auth"

type Errors<T> = Partial<Record<keyof T, ValidationKey>>

// Runs a zod schema on form data and keeps the first error of each field.
// Zod messages are translation keys, translated here under `Validation`.
export function useFormErrors<T extends Record<string, unknown>>(
  schema: z.ZodType<T>
) {
  const t = useTranslations("Validation")
  const [errors, setErrors] = useState<Errors<T>>({})

  function validate(data: unknown): T | null {
    const result = schema.safeParse(data)
    if (result.success) {
      setErrors({})
      return result.data
    }

    const next: Errors<T> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof T
      if (!next[field]) next[field] = issue.message as ValidationKey
    }
    setErrors(next)
    return null
  }

  function errorFor(field: keyof T) {
    const key: ValidationKey | undefined = errors[field]
    return key ? t(key) : null
  }

  /** Shows an error coming from the server under a field. */
  function setFieldError(field: keyof T, key: ValidationKey) {
    setErrors((prev) => ({ ...prev, [field]: key }))
  }

  return { errors, validate, errorFor, setFieldError }
}
