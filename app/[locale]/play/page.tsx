import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map(({ key, href }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{t(`modes.${key}.title`)}</CardTitle>
              <CardDescription>{t(`modes.${key}.description`)}</CardDescription>
              {!href && (
                <CardAction>
                  <Badge variant="secondary">{t("soon")}</Badge>
                </CardAction>
              )}
            </CardHeader>
            {href && (
              <CardFooter>
                <ButtonLink href={href}>{t("start")}</ButtonLink>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
