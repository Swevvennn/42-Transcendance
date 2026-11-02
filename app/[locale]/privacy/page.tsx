import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { LegalPage } from "@/components/legal-page"

const sections = ["collect", "use", "storage", "rights", "contact"] as const

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Privacy" })
  return { title: t("title") }
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Privacy")

  return (
    <LegalPage
      title={t("title")}
      updated={t("updated")}
      sections={sections.map((key) => ({
        key,
        title: t(`sections.${key}.title`),
        body: t(`sections.${key}.body`),
      }))}
    />
  )
}
