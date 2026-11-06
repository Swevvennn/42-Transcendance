import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"
import { landingFeatures } from "@/components/templates/features"

const swissButton = "h-12 rounded-none px-6 text-sm font-semibold"

export function SwissLanding() {
  const t = useTranslations("Templates.styles.swiss")
  const tHome = useTranslations("Home")

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4">
      <div className="grid grid-cols-12 gap-4 border-b-2 border-border py-3 text-xs font-semibold">
        <span className="col-span-6 sm:col-span-4">{t("kicker")}</span>
        <span className="col-span-6 text-right sm:col-span-4 sm:col-start-9">
          {tHome("title")}
        </span>
      </div>

      <section className="grid grid-cols-12 gap-4 py-10 lg:py-16">
        <p className="swiss-vertical col-span-1 hidden text-xs font-semibold tracking-widest text-muted-foreground uppercase lg:block">
          {t("vertical")}
        </p>

        <div className="col-span-12 flex flex-col gap-8 lg:col-span-7">
          <h1 className="font-display text-[7rem] leading-[0.8] font-black tracking-tighter sm:text-[12rem]">
            {t("headline")}
            <span className="text-primary">.</span>
          </h1>
          <p className="max-w-md text-2xl leading-tight font-semibold tracking-tight">
            {t("tagline")}
          </p>
          <p className="max-w-md text-muted-foreground">{tHome("subtitle")}</p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/play" className={swissButton}>
              {tHome("play")}
              <ArrowRightIcon weight="bold" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/signup" variant="secondary" className={swissButton}>
              {tHome("signup")}
            </ButtonLink>
          </div>
        </div>

        {/* Abstract court: two bars and a red ball on the grid. */}
        <div
          className="relative col-span-12 aspect-square sm:col-span-8 sm:col-start-3 lg:col-span-4 lg:col-start-9"
          aria-hidden
        >
          <div className="absolute top-0 left-0 h-1/2 w-3 bg-foreground" />
          <div className="absolute right-0 bottom-0 h-1/3 w-3 bg-foreground" />
          <div className="absolute top-1/2 left-1/2 h-full w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
          <div className="absolute top-[30%] left-[35%] aspect-square w-[45%] rounded-full bg-primary" />
        </div>
      </section>

      <section className="grid gap-8 border-t-2 border-border py-10 sm:grid-cols-12">
        <h2 className="text-sm font-semibold sm:col-span-3">{t("featuresTitle")}</h2>
        <div className="grid gap-8 sm:col-span-9 sm:grid-cols-3">
          {landingFeatures.map(({ key }, index) => (
            <div key={key} className="flex flex-col gap-3 border-t border-border pt-3">
              <span className="text-4xl font-black tracking-tighter text-primary">
                0{index + 1}
              </span>
              <h3 className="text-lg leading-tight font-semibold">
                {tHome(`features.${key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tHome(`features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
