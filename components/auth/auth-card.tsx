import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { FieldSeparator } from "@/components/ui/field"

// Shared frame for the login and signup pages: big title on the left,
// form on the right.
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
        {/* OAuth 42 will be wired with Better Auth. */}
        <Button variant="outline" size="lg" className="h-10 w-full" disabled>
          {t("oauth42")}
        </Button>
        <p className="flex justify-center gap-1 text-xs">{footer}</p>
      </div>
    </div>
  )
}
