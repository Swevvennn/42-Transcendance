import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <ButtonLink href="/play" variant="outline">
          {t("back")}
        </ButtonLink>
      </div>
      <OnlineLobby />
    </div>
  )
}
