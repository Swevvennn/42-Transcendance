import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"
import { Link } from "@/i18n/navigation"
import { fortyTwoCredentials } from "@/lib/oauth42"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth" })
  return { title: t("login.title") }
}

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params
  // Better Auth comes back here with ?error=… when the 42 login fails.
  const { error } = await searchParams
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Auth")

  return (
    <AuthCard
      oauthEnabled={fortyTwoCredentials() !== null}
      title={t("login.title")}
      description={t("login.description")}
      oauthError={typeof error === "string"}
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
