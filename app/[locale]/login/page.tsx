import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"
import { Link } from "@/i18n/navigation"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth" })
  return { title: t("login.title") }
}

export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Auth")

  return (
    <AuthCard
      title={t("login.title")}
      description={t("login.description")}
      footer={
        <>
          <span className="text-muted-foreground">{t("login.noAccount")}</span>
          <Link href="/signup" className="underline">
            {t("login.signupLink")}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
