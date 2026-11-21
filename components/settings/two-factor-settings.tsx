"use client"

import { QRCodeSVG } from "qrcode.react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { authError, type AuthErrorResult } from "@/components/auth/auth-error"
import { FormAlert } from "@/components/auth/form-alert"
import { useFormErrors } from "@/components/auth/use-form-errors"
import { Badge } from "@/components/ui/badge"
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
import { twoFactor } from "@/lib/auth-client"
import {
  passwordConfirmSchema,
  totpCodeSchema,
} from "@/lib/validation/auth"

type Setup = { totpURI: string; backupCodes: string[] }

/** The key inside otpauth://totp/...?secret=XXX, for manual entry. */
const secretOf = (uri: string) => new URL(uri).searchParams.get("secret") ?? ""

/**
 * Turn 2FA on or off. Turning it on is 3 steps:
 * password → scan the QR code + note the backup codes → type a first code.
 * Better Auth only enables 2FA once that first code is right.
 */
export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const t = useTranslations("Settings.twoFactor")
  const tAuth = useTranslations("Auth")
  const router = useRouter()
  const [setup, setSetup] = useState<Setup | null>(null)
  const [message, setMessage] = useState<"done" | "disabledOk" | null>(null)
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<AuthErrorResult | null>(null)
  const passwordForm = useFormErrors(passwordConfirmSchema)
  const codeForm = useFormErrors(totpCodeSchema)

  async function onPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setMessage(null)
    const data = passwordForm.validate(Object.fromEntries(new FormData(event.currentTarget)))
    if (!data) return

    setPending(true)
    if (enabled) {
      const { error } = await twoFactor.disable({ password: data.password })
      setPending(false)
      if (error) return setFormError(authError(error))
      setMessage("disabledOk")
      router.refresh()
    } else {
      const { data: result, error } = await twoFactor.enable({ password: data.password })
      setPending(false)
      if (error || result.method !== "totp") {
        return setFormError(authError(error ?? {}))
      }
      setSetup({ totpURI: result.totpURI, backupCodes: result.backupCodes })
    }
  }

  async function onCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const data = codeForm.validate(Object.fromEntries(new FormData(event.currentTarget)))
    if (!data) return

    setPending(true)
    const { error } = await twoFactor.verifyTotp({ code: data.code })
    setPending(false)
    if (error) return setFormError(authError(error))
    setSetup(null)
    setMessage("done")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">{t("title")}</span>
        <Badge variant={enabled ? "default" : "outline"}>
          {enabled ? t("enabled") : t("disabled")}
        </Badge>
      </div>
      {message && <p className="text-sm text-muted-foreground">{t(message)}</p>}

      {setup ? (
        <form onSubmit={onCode} noValidate>
          <FieldGroup>
            <p className="text-sm">{t("scan")}</p>
            <div className="w-fit bg-white p-3">
              <QRCodeSVG value={setup.totpURI} size={176} title={t("qrLabel")} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("secret")} <code className="break-all text-foreground">{secretOf(setup.totpURI)}</code>
            </p>

            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{t("backupCodes")}</p>
              <p className="text-xs text-muted-foreground">{t("backupHint")}</p>
              <ul className="grid grid-cols-2 gap-1 font-mono text-xs sm:grid-cols-5">
                {setup.backupCodes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>

            <Field data-invalid={!!codeForm.errors.code}>
              <FieldLabel htmlFor="totp-code">{tAuth("twoFactor.code")}</FieldLabel>
              <Input
                id="totp-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-invalid={!!codeForm.errors.code}
              />
              <FieldError>{codeForm.errorFor("code")}</FieldError>
            </Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {t("verify")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSetup(null)}>
                {t("cancel")}
              </Button>
            </div>
            <FormAlert error={formError} />
          </FieldGroup>
        </form>
      ) : (
        <form onSubmit={onPassword} noValidate>
          <FieldGroup>
            <Field data-invalid={!!passwordForm.errors.password}>
              <FieldLabel htmlFor="twofa-password">{tAuth("password")}</FieldLabel>
              <FieldDescription>{t("passwordHint")}</FieldDescription>
              <Input
                id="twofa-password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!passwordForm.errors.password}
              />
              <FieldError>{passwordForm.errorFor("password")}</FieldError>
            </Field>
            <Button
              type="submit"
              variant={enabled ? "destructive" : "default"}
              className="w-fit"
              disabled={pending}
            >
              {enabled ? t("disable") : t("enable")}
            </Button>
            <FormAlert error={formError} />
          </FieldGroup>
        </form>
      )}
    </div>
  )
}
