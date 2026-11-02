import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = ["online", "ai", "tournament"] as const

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Home")

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-center gap-4 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-muted-foreground">{t("subtitle")}</p>
        <div className="flex gap-2">
          <ButtonLink href="/play" size="lg">
            {t("play")}
          </ButtonLink>
          <ButtonLink href="/signup" variant="outline" size="lg">
            {t("signup")}
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((key) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{t(`features.${key}.title`)}</CardTitle>
              <CardDescription>{t(`features.${key}.description`)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  )
}
