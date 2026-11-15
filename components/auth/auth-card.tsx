import { useTranslations } from "next-intl"

import { OAuth42Button } from "@/components/auth/oauth42-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldSeparator } from "@/components/ui/field"

// Shared frame for the login and signup pages.
export function AuthCard({
  title,
  description,
  footer,
  oauthEnabled,
  oauthError = false,
  children,
}: {
  title: string
  description: string
  footer: React.ReactNode
  /** "Continue with 42" is configured on the server. */
  oauthEnabled: boolean
  /** The 42 login came back with an error. */
  oauthError?: boolean
  children: React.ReactNode
}) {
  const t = useTranslations("Auth")

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>{title}</h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children}
        <FieldSeparator>{t("or")}</FieldSeparator>
        <OAuth42Button enabled={oauthEnabled} initialError={oauthError} />
      </CardContent>
      <CardFooter className="justify-center gap-1 text-xs">{footer}</CardFooter>
    </Card>
  )
}
