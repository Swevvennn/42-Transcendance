"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authError, type AuthErrorResult } from "@/components/auth/auth-error"
import { FormAlert } from "@/components/auth/form-alert"
import { TwoFactorStep } from "@/components/auth/two-factor-step"
import { useFormErrors } from "@/components/auth/use-form-errors"
import { useRouter } from "@/i18n/navigation"
import { signIn } from "@/lib/auth-client"
import { loginSchema, type LoginInput } from "@/lib/validation/auth"

export function LoginForm() {
  const t = useTranslations("Auth")
  const router = useRouter()
  const { errors, validate, errorFor } = useFormErrors<LoginInput>(loginSchema)
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<AuthErrorResult | null>(null)
  /** The password was right but the account has 2FA: ask for the code. */
  const [needsCode, setNeedsCode] = useState(false)

  function loggedIn() {
    router.push("/play")
    router.refresh()
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const data = validate(Object.fromEntries(new FormData(event.currentTarget)))
    if (!data) return

    // The server checks the same fields again (lib/auth.ts).
    setPending(true)
    const { data: result, error } = await signIn.email(data)
    setPending(false)

    if (error) return setFormError(authError(error))
    if (result && "twoFactorRedirect" in result && result.twoFactorRedirect) {
      return setNeedsCode(true)
    }
    loggedIn()
  }

  if (needsCode) {
    return <TwoFactorStep onDone={loggedIn} onBack={() => setNeedsCode(false)} />
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

        <Button type="submit" className="w-full" disabled={pending}>
          {t("login.submit")}
        </Button>

        <FormAlert error={formError} />
      </FieldGroup>
    </form>
  )
}
