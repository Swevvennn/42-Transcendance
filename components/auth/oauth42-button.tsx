"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"

import { authError, type AuthErrorResult } from "@/components/auth/auth-error"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { signIn } from "@/lib/auth-client"

/**
 * "Continue with 42": Better Auth sends the browser to the 42 intra, which
 * comes back to /api/auth/callback/42. On failure Better Auth comes back to
 * the login page with ?error=… (shown by the page as `initialError`).
 */
export function OAuth42Button({
  enabled,
  initialError = false,
}: {
  /** False when the server has no 42 app credentials (FT_CLIENT_ID / SECRET). */
  enabled: boolean
  initialError?: boolean
}) {
  const t = useTranslations("Auth")
  const locale = useLocale()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AuthErrorResult | null>(
    initialError ? { field: null, kind: "auth", key: "oauthFailed" } : null
  )

  async function onClick() {
    setError(null)
    setPending(true)
    const { error } = await signIn.social({
      provider: "42",
      callbackURL: `/${locale}/play`,
      newUserCallbackURL: `/${locale}/profile`,
      errorCallbackURL: `/${locale}/login`,
    })
    // On success the browser is already leaving the page.
    if (error) {
      setPending(false)
      setError(authError(error))
    }
  }

  return (
    <>
      <Button variant="outline" className="w-full" onClick={onClick} disabled={pending || !enabled}>
        {t("oauth42")}
      </Button>
      {!enabled && (
        <p className="text-xs text-muted-foreground">{t("errors.oauth42Unavailable")}</p>
      )}
      <FormAlert error={error} />
    </>
  )
}
