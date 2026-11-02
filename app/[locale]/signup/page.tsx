import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AuthCard } from "@/components/auth/auth-card"
import { SignupForm } from "@/components/auth/signup-form"
import { Link } from "@/i18n/navigation"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/signup">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Auth" })
  return { title: t("signup.title") }
}

export default async function SignupPage({
  params,
}: PageProps<"/[locale]/signup">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Auth")

  return (
    <AuthCard
      title={t("signup.title")}
      description={t("signup.description")}
      footer={
        <>
          <span className="text-muted-foreground">{t("signup.hasAccount")}</span>
          <Link href="/login" className="underline">
            {t("signup.loginLink")}
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  )
}
