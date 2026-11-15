import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { OnlineMatch } from "@/components/online/online-match"
import { idSchema } from "@/lib/validation/game"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play/match/[id]">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Match" })
  return { title: t("title") }
}

export default async function MatchPage({ params }: PageProps<"/[locale]/play/match/[id]">) {
  const { locale, id } = await params
  setRequestLocale(locale as Locale)
  if (!idSchema.safeParse(id).success) notFound()
  const t = await getTranslations("Match")

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <OnlineMatch matchId={id} />
    </div>
  )
}
