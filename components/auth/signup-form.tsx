"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { useFormErrors } from "@/components/auth/use-form-errors"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signupSchema, type SignupInput } from "@/lib/validation/auth"

export function SignupForm() {
  const t = useTranslations("Auth")
  const { errors, validate, errorFor } = useFormErrors<SignupInput>(signupSchema)
  const [submitted, setSubmitted] = useState(false)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    // TODO: call the auth backend once it exists (it must re-validate with signupSchema).
    setSubmitted(validate(data) !== null)
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="username">{t("signup.username")}</FieldLabel>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            aria-invalid={!!errors.username}
          />
          <FieldError>{errorFor("username")}</FieldError>
        </Field>

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
            autoComplete="new-password"
            aria-invalid={!!errors.password}
          />
          <FieldDescription>{t("signup.passwordHint")}</FieldDescription>
          <FieldError>{errorFor("password")}</FieldError>
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">
            {t("signup.confirmPassword")}
          </FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
          />
          <FieldError>{errorFor("confirmPassword")}</FieldError>
        </Field>

        <Button type="submit" size="lg" className="h-10 w-full text-sm font-semibold">
          {t("signup.submit")}
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
