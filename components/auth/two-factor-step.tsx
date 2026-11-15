"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { authError, type AuthErrorResult } from "@/components/auth/auth-error"
import { FormAlert } from "@/components/auth/form-alert"
import { useFormErrors } from "@/components/auth/use-form-errors"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { twoFactor } from "@/lib/auth-client"
import { backupCodeSchema, totpCodeSchema } from "@/lib/validation/auth"

/**
 * Second login step for accounts with 2FA: the password was right, Better
 * Auth now waits for a code from the authenticator app (or a backup code).
 */
export function TwoFactorStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const t = useTranslations("Auth.twoFactor")
  const [backup, setBackup] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<AuthErrorResult | null>(null)
  const { errors, validate, errorFor } = useFormErrors(backup ? backupCodeSchema : totpCodeSchema)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const data = validate(Object.fromEntries(new FormData(event.currentTarget)))
    if (!data) return

    setPending(true)
    const { error } = backup
      ? await twoFactor.verifyBackupCode({ code: data.code, trustDevice })
      : await twoFactor.verifyTotp({ code: data.code, trustDevice })
    setPending(false)
    if (error) return setFormError(authError(error))
    onDone()
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="code">{backup ? t("backupCode") : t("code")}</FieldLabel>
          <FieldDescription>{backup ? t("backupDescription") : t("description")}</FieldDescription>
          <Input
            key={backup ? "backup" : "totp"}
            id="code"
            name="code"
            autoComplete="one-time-code"
            inputMode={backup ? "text" : "numeric"}
            autoFocus
            aria-invalid={!!errors.code}
          />
          <FieldError>{errorFor("code")}</FieldError>
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="trustDevice"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(checked)}
          />
          <FieldLabel htmlFor="trustDevice" className="font-normal">
            {t("trustDevice")}
          </FieldLabel>
        </Field>

        <Button type="submit" className="w-full" disabled={pending}>
          {t("submit")}
        </Button>
        <FormAlert error={formError} />

        <div className="flex justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            {t("back")}
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => {
              setBackup(!backup)
              setFormError(null)
            }}
          >
            {backup ? t("useTotp") : t("useBackup")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
