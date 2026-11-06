import type { Metadata } from "next"
import type { ReactNode } from "react"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { logoDesigns, logos } from "@/components/brand/logos"
import { ButtonLink } from "@/components/button-link"
import { LandingCourt } from "@/components/landing/landing"
import { isAnime, landingMotions } from "@/components/landing/motion"
import { PageHeader } from "@/components/page-header"
import { PongDemo } from "@/components/templates/pong-demo"
import { allTemplateFonts, templateStyles } from "@/components/templates/registry"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const fullSizes = [112, 56, 28]
const iconSizes = [64, 32, 16]

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/templates">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Templates",
  })
  return { title: t("title") }
}

export default async function TemplatesPage({
  params,
}: PageProps<"/[locale]/templates">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Templates")
  const tMeta = await getTranslations("Metadata")
  const name = tMeta("title")

  return (
    <div className={cn("flex flex-col gap-10", allTemplateFonts)}>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<p className="text-xs text-muted-foreground">{t("notice")}</p>}
      />

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("motionTitle")}</h2>
          <p className="text-muted-foreground">{t("motionDescription")}</p>
        </div>
        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {landingMotions.map((variant, index) => (
            <li
              key={variant}
              className="flex flex-col gap-4 border-t-2 border-foreground pt-4"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-4xl font-black tracking-tighter text-primary">
                  0{index + 1}
                </span>
                {/* Mini preview: Rally loops, Kinetic/Assemble play their intro once. */}
                <div
                  data-motion={still(variant) ? undefined : variant}
                  className="w-24"
                >
                  <LandingCourt motion={still(variant) ? undefined : variant} compact />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold tracking-tight">{t(`motion.${variant}.name`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`motion.${variant}.description`)}</p>
              </div>
              <ButtonLink
                href={`/templates/motion/${variant}`}
                size="lg"
                className="mt-auto h-10 w-fit px-4 text-sm font-semibold"
              >
                {t("open")}
              </ButtonLink>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col items-start gap-4 border-t-2 border-foreground pt-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("characters.title")}</h2>
          <p className="max-w-2xl text-muted-foreground">{t("characters.description")}</p>
        </div>
        <ButtonLink href="/templates/characters" size="lg" className="h-10 px-4 text-sm font-semibold">
          {t("characters.open")}
        </ButtonLink>
      </section>

      <section className="flex flex-col gap-6 border-t-2 border-foreground pt-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("logosTitle")}</h2>
          <p className="max-w-2xl text-muted-foreground">{t("logosDescription")}</p>
        </div>
        <ol className="flex flex-col">
          {logoDesigns.map((design, index) => {
            const { Full, Icon } = logos[design]
            return (
              <li
                key={design}
                className="grid gap-6 border-t border-border py-8 first:border-t-0 first:pt-2 lg:grid-cols-12"
              >
                <div className="flex flex-col gap-1 lg:col-span-3">
                  <span className="text-4xl font-black tracking-tighter text-primary">
                    0{index + 1}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight">{t(`logos.${design}.name`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`logos.${design}.description`)}</p>
                </div>
                <div className="flex min-w-0 flex-col gap-8 lg:col-span-9">
                  <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
                    {fullSizes.map((size) => (
                      <LogoSample key={size} caption={`${t("logoFull")} · ${t("sizePx", { size })}`}>
                        <Full name={name} size={size} />
                      </LogoSample>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
                    {iconSizes.map((size) => (
                      <LogoSample key={size} caption={`${t("logoIcon")} · ${t("sizePx", { size })}`}>
                        <Icon name={name} size={size} />
                      </LogoSample>
                    ))}
                    <LogoSample caption={t("logoInverted")}>
                      {/* Swaps the foreground and background tokens. */}
                      <div className="[--inv-bg:var(--foreground)] [--inv-fg:var(--background)]">
                        <div className="flex items-center gap-4 bg-background p-4 text-foreground [--background:var(--inv-bg)] [--foreground:var(--inv-fg)]">
                          <Full name={name} size={32} />
                          <Icon name={name} size={32} />
                        </div>
                      </div>
                    </LogoSample>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-6 border-t-2 border-foreground pt-8">
        <h2 className="text-2xl font-bold tracking-tight">{t("stylesTitle")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templateStyles.map((style) => (
          <Card key={style} className="pt-0">
            {/* Swatch rendered with the style's own tokens and font. */}
            <div
              className={cn(
                `theme-${style}`,
                "flex flex-col gap-3 border-b border-border bg-background p-4 text-foreground",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-lg leading-none">
                  {t(`styles.${style}.name`)}
                </span>
                <span className="flex gap-1" aria-hidden>
                  <span className="size-3 bg-primary" />
                  <span className="size-3 bg-secondary" />
                  <span className="size-3 bg-accent" />
                </span>
              </div>
              <PongDemo
                className="border border-border bg-card text-muted-foreground"
                ballClassName="bg-primary"
              />
            </div>
            <CardHeader>
              <CardTitle>{t(`styles.${style}.name`)}</CardTitle>
              <CardDescription>{t(`styles.${style}.description`)}</CardDescription>
              <CardDescription>
                {t("fontLine", { font: t(`styles.${style}.font`) })}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <ButtonLink href={`/templates/${style}`} className="w-full">
                {t("open")}
              </ButtonLink>
            </CardFooter>
          </Card>
        ))}
      </div>
      </section>
    </div>
  )
}

// The anime and attract variants are driven by JS: their mini preview is static.
function still(variant: string) {
  return variant === "attract" || isAnime(variant)
}

function LogoSample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-start gap-3">
      <div className="flex items-end">{children}</div>
      <figcaption className="text-xs text-muted-foreground tabular-nums">{caption}</figcaption>
    </figure>
  )
}
