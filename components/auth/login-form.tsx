"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loginSchema, type LoginInput } from "@/lib/validation/auth"
import { useFormErrors } from "@/components/auth/use-form-errors"

export function LoginForm() {
  const t = useTranslations("Auth")
  const { errors, validate, errorFor } = useFormErrors<LoginInput>(loginSchema)
  const [submitted, setSubmitted] = useState(false)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    // TODO: call the auth backend once it exists (it must re-validate with loginSchema).
    setSubmitted(validate(data) !== null)
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          <FieldError>{errorFor("email")}</FieldError>
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
          />
          <FieldError>{errorFor("password")}</FieldError>
        </Field>

        <Button type="submit" size="lg" className="h-10 w-full text-sm font-semibold">
          {t("login.submit")}
        </Button>

        {submitted && (
          <p role="status" className="text-xs text-muted-foreground">
            {t("notConnected")}
          </p>
        )}
      </FieldGroup>
    </form>
  )
}
