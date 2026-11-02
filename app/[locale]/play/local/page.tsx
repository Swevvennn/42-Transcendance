import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
import { LocalPong } from "@/components/pong/local-pong"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play/local">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Game" })
  return { title: t("title") }
}

export default async function LocalGamePage({
  params,
}: PageProps<"/[locale]/play/local">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Game")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("controls")}</p>
        </div>
        <ButtonLink href="/play" variant="outline">
          {t("back")}
        </ButtonLink>
      </div>
      <LocalPong />
    </div>
  )
}
