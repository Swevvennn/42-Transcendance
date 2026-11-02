import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { LegalPage } from "@/components/legal-page"

const sections = ["acceptance", "account", "conduct", "service", "changes"] as const

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Terms" })
  return { title: t("title") }
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Terms")

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
