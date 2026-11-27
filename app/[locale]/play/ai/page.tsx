import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
import { PageHeader } from "@/components/page-header"
import { LocalPong } from "@/components/pong/local-pong"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play/ai">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "AiGame" })
  return { title: t("title") }
}

export default async function AiGamePage({ params }: PageProps<"/[locale]/play/ai">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("AiGame")

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("controls")}
        actions={
          <ButtonLink href="/play" variant="outline" size="lg" className="h-10 px-4 text-sm">
            {t("back")}
          </ButtonLink>
        }
      />
      <LocalPong vsAi />
    </div>
  )
}
