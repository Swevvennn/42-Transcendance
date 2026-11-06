import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"
import { landingFeatures } from "@/components/templates/features"
import { PongDemo } from "@/components/templates/pong-demo"
import { cn } from "@/lib/utils"

const risoButton =
  "riso-ink h-12 rounded-full border-2 px-7 text-base font-bold hover:-rotate-2"

const tilt = ["-rotate-1", "rotate-1", "-rotate-2"] as const

export function RisoLanding() {
  const t = useTranslations("Templates.styles.riso")
  const tHome = useTranslations("Home")
  const headline = t("headline")

  return (
    <div className="riso-grain">
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col items-start gap-6">
          <span className="riso-ink -rotate-2 bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            {t("kicker")}
          </span>
          <h1 className="riso-misprint font-display text-6xl leading-[0.9] font-extrabold tracking-tight sm:text-8xl">
            <span className="riso-ink text-secondary">{headline}</span>
            <span className="riso-ink text-primary" aria-hidden>
              {headline}
            </span>
          </h1>
          <p className="max-w-md text-lg font-medium">{t("tagline")}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href="/play"
              className={cn(risoButton, "border-primary hover:bg-primary")}
            >
              {tHome("play")}
            </ButtonLink>
            <ButtonLink
              href="/signup"
              variant="outline"
              className={cn(
                risoButton,
                "border-secondary bg-transparent text-secondary hover:bg-secondary hover:text-secondary-foreground",
              )}
            >
              {tHome("signup")}
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden>
          <div className="riso-ink riso-halftone absolute top-0 right-0 size-3/4 rounded-full text-primary" />
          <div className="riso-ink absolute bottom-4 left-0 h-1/2 w-2/3 rotate-6 bg-secondary/85" />
          <div className="riso-ink absolute top-1/4 left-[8%] w-[84%] -rotate-3 border-2 border-border bg-card p-2">
            <PongDemo
              className="text-secondary"
              ballClassName="riso-ink rounded-full bg-primary"
              paddleClassName="riso-ink bg-secondary"
            />
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4">
        <span className="riso-float riso-ink absolute -top-10 right-6 flex size-28 rotate-12 items-center justify-center rounded-full bg-accent p-3 text-center text-sm leading-tight font-extrabold text-accent-foreground">
          {t("sticker")}
        </span>
      </div>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-6 pb-20">
        <h2 className="font-display text-4xl font-extrabold">
          <span className="riso-ink bg-primary/70 px-2">{t("featuresTitle")}</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {landingFeatures.map(({ key, Icon }, index) => (
            <div
              key={key}
              className={cn(
                "flex flex-col gap-3 border-2 border-border bg-card p-6",
                tilt[index],
              )}
            >
              <span className="riso-ink flex size-12 items-center justify-center rounded-full bg-primary/80">
                <Icon className="size-7 text-secondary" weight="bold" aria-hidden />
              </span>
              <h3 className="font-display text-2xl font-extrabold">
                {tHome(`features.${key}.title`)}
              </h3>
              <p className="font-medium text-muted-foreground">
                {tHome(`features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
