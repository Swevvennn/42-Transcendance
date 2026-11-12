"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { authError, type AuthErrorResult } from "@/components/auth/auth-error"
import { FormAlert } from "@/components/auth/form-alert"
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
import { useRouter } from "@/i18n/navigation"
import { signUp } from "@/lib/auth-client"
import { signupSchema, type SignupInput } from "@/lib/validation/auth"

export function SignupForm() {
  const t = useTranslations("Auth")
  const router = useRouter()
  const { errors, validate, errorFor, setFieldError } =
    useFormErrors<SignupInput>(signupSchema)
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<AuthErrorResult | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const data = validate(Object.fromEntries(new FormData(event.currentTarget)))
    if (!data) return

    // The server checks the same fields again (lib/auth.ts).
    setPending(true)
    const { error } = await signUp.email({
      email: data.email,
      password: data.password,
      name: data.username,
      username: data.username,
    })
    setPending(false)

    if (!error) {
      // Better Auth logs the new user in right away.
      router.push("/play")
      router.refresh()
      return
    }
    const result = authError(error)
    if (result.field) setFieldError(result.field, result.key)
    else setFormError(result)
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

        <Button type="submit" className="w-full" disabled={pending}>
          {t("signup.submit")}
        </Button>

        <FormAlert error={formError} />
      </FieldGroup>
    </form>
  )
}
