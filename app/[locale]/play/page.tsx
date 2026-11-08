import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"

// Only the local mode is playable for now; the others need the game server.
const modes = [
  { key: "local", href: "/play/local" },
  { key: "ai", href: null },
  { key: "online", href: null },
  { key: "tournament", href: null },
] as const

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Play" })
  return { title: t("title") }
}

export default async function PlayPage({ params }: PageProps<"/[locale]/play">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Play")

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("title")} description={t("description")} />

      <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
        {modes.map(({ key, href }, index) => (
          <li
            key={key}
            className="flex flex-col gap-4 border-t-2 border-foreground pt-4"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="text-5xl font-black tracking-tighter">
                0{index + 1}
              </span>
              {!href && <Badge variant="outline">{t("soon")}</Badge>}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight">
                {t(`modes.${key}.title`)}
              </h2>
              <p className="text-muted-foreground">{t(`modes.${key}.description`)}</p>
            </div>
            {href && (
              <ButtonLink href={href} size="lg" className="h-11 w-fit px-5 text-sm font-semibold">
                {t("start")}
                <ArrowRightIcon weight="bold" className="rtl:rotate-180" aria-hidden />
              </ButtonLink>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
