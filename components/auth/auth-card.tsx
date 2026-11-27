import { useTranslations } from "next-intl"

import type { AuthErrorKey } from "@/components/auth/auth-error"
import { OAuth42Button } from "@/components/auth/oauth42-button"
import { FieldSeparator } from "@/components/ui/field"

// Shared frame for the login and signup pages: big title on the left,
// form on the right.
export function AuthCard({
  title,
  description,
  footer,
  oauthEnabled,
  oauthError = null,
  children,
}: {
  title: string
  description: string
  footer: React.ReactNode
  /** "Continue with 42" is configured on the server. */
  oauthEnabled: boolean
  /** The 42 login came back with an error. */
  oauthError?: AuthErrorKey | null
  children: React.ReactNode
}) {
  const t = useTranslations("Auth")

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <header className="flex flex-col gap-4 border-t-2 border-foreground pt-4 md:col-span-6">
        <h1 className="text-5xl leading-[0.9] font-bold tracking-tighter sm:text-7xl">
          {title}
          <span className="text-primary">.</span>
        </h1>
        <p className="max-w-sm text-muted-foreground">{description}</p>
      </header>

      <div className="flex flex-col gap-4 border-t-2 border-foreground pt-4 md:col-span-5 md:col-start-8">
        {children}
        <FieldSeparator>{t("or")}</FieldSeparator>
        <OAuth42Button enabled={oauthEnabled} initialError={oauthError} />
        <p className="flex justify-center gap-1 text-xs">{footer}</p>
      </div>
    </div>
  )
}
