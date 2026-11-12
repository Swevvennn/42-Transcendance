import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { TournamentList } from "@/components/online/tournament-list"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play/tournament">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Tournament" })
  return { title: t("title") }
}

export default async function TournamentsPage({
  params,
}: PageProps<"/[locale]/play/tournament">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Tournament")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <TournamentList />
    </div>
  )
}
