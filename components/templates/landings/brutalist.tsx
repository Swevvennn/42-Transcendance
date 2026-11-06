import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"
import { landingFeatures } from "@/components/templates/features"
import { PongDemo } from "@/components/templates/pong-demo"

const brutalButton =
  "brutal-shadow-sm h-auto rounded-none border-[3px] border-foreground px-6 py-3 text-base font-bold uppercase hover:translate-x-1 hover:translate-y-1 hover:shadow-none"

export function BrutalistLanding() {
  const t = useTranslations("Templates.styles.brutalist")
  const tHome = useTranslations("Home")
  const marquee = t("marquee")

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div className="flex flex-col items-start gap-6">
          <span className="border-[3px] border-foreground bg-accent px-3 py-1 text-sm font-bold text-accent-foreground uppercase">
            {t("kicker")}
          </span>
          <h1 className="font-display text-5xl leading-[0.9] uppercase sm:text-7xl lg:text-8xl">
            {t("headline")}
          </h1>
          <p className="max-w-md text-lg font-medium">{t("tagline")}</p>
          <div className="flex flex-wrap gap-4">
            <ButtonLink href="/play" className={brutalButton}>
              {tHome("play")}
              <ArrowRightIcon weight="bold" aria-hidden />
            </ButtonLink>
            <ButtonLink
              href="/signup"
              variant="secondary"
              className={brutalButton + " hover:bg-secondary"}
            >
              {tHome("signup")}
            </ButtonLink>
          </div>
        </div>

        <div className="brutal-shadow rotate-2 border-[3px] border-foreground bg-primary p-3">
          <PongDemo className="border-[3px] border-foreground bg-card" />
        </div>
      </section>

      <div
        className="overflow-hidden border-y-[3px] border-foreground bg-foreground py-3 text-background"
        aria-hidden
      >
        <div className="brutal-marquee font-display text-2xl uppercase">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="pr-6 whitespace-nowrap">
              {marquee}
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16">
        <h2 className="font-display text-4xl uppercase">{t("featuresTitle")}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {landingFeatures.map(({ key, Icon }, index) => (
            <div
              key={key}
              className="brutal-shadow flex flex-col gap-4 border-[3px] border-foreground bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-5xl">0{index + 1}</span>
                <Icon className="size-10" weight="bold" aria-hidden />
              </div>
              <h3 className="text-xl font-bold uppercase">
                {tHome(`features.${key}.title`)}
              </h3>
              <p className="font-medium">{tHome(`features.${key}.description`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
