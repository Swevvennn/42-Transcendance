import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
import { PageHeader } from "@/components/page-header"
import { OnlineLobby } from "@/components/online/online-lobby"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play/online">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Online" })
  return { title: t("title") }
}

export default async function OnlinePage({ params }: PageProps<"/[locale]/play/online">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Online")

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        className="border-b-0 pb-0"
        title={t("title")}
        description={t("description")}
        actions={
          <ButtonLink href="/play" variant="outline" size="lg" className="h-10 px-4">
            {t("back")}
          </ButtonLink>
        }
      />
      <OnlineLobby />
    </div>
  )
}
