import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
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
  children,
}: {
  title: string
  description: string
  footer: React.ReactNode
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
        {/* OAuth 42 will be wired with Better Auth. */}
        <Button variant="outline" className="w-full" disabled>
          {t("oauth42")}
        </Button>
      </CardContent>
      <CardFooter className="justify-center gap-1 text-xs">{footer}</CardFooter>
    </Card>
  )
}
