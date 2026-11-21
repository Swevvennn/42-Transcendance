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
import { changePassword } from "@/lib/auth-client"
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validation/auth"

/**
 * Change the password: current password + the new one twice.
 * The other logged-in browsers are logged out; this one stays logged in.
 */
export function PasswordSettings() {
  const t = useTranslations("Settings.password")
  const tAuth = useTranslations("Auth")
  const { errors, validate, errorFor } =
    useFormErrors<ChangePasswordInput>(changePasswordSchema)
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState<AuthErrorResult | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setFormError(null)
    setSaved(false)
    const data = validate(Object.fromEntries(new FormData(form)))
    if (!data) return

    // The server checks the same fields again (lib/auth.ts).
    setPending(true)
    const { error } = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    })
    setPending(false)

    if (error) return setFormError(authError(error))
    form.reset()
    setSaved(true)
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.currentPassword}>
          <FieldLabel htmlFor="current-password">{t("current")}</FieldLabel>
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
          />
          <FieldError>{errorFor("currentPassword")}</FieldError>
        </Field>

        <Field data-invalid={!!errors.newPassword}>
          <FieldLabel htmlFor="new-password">{t("new")}</FieldLabel>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
          />
          <FieldDescription>{tAuth("signup.passwordHint")}</FieldDescription>
          <FieldError>{errorFor("newPassword")}</FieldError>
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirm-new-password">{t("confirm")}</FieldLabel>
          <Input
            id="confirm-new-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
          />
          <FieldError>{errorFor("confirmPassword")}</FieldError>
        </Field>

        <Button type="submit" className="w-fit" disabled={pending}>
          {t("save")}
        </Button>

        {saved && (
          <p role="status" className="text-sm text-muted-foreground">
            {t("saved")}
          </p>
        )}
        <FormAlert error={formError} />
      </FieldGroup>
    </form>
  )
}
