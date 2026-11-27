import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"
import { landingFeatures } from "@/components/templates/features"
import { PongDemo } from "@/components/templates/pong-demo"

export function EditorialLanding() {
  const t = useTranslations("Templates.styles.editorial")
  const tHome = useTranslations("Home")

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col items-center gap-2 border-y-4 border-double border-foreground py-4 text-center">
        <p className="font-display text-4xl sm:text-6xl">{t("masthead")}</p>
        <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
          {t("issue")}
        </p>
      </header>

      <article className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            {t("section")}
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-6xl">
            {t("headline")}
          </h1>
          <p className="font-display text-xl text-muted-foreground italic">
            {tHome("subtitle")}
          </p>
          <p className="editorial-dropcap editorial-columns text-sm leading-relaxed">
            {t("lede")}
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/play" size="lg" className="h-10 rounded-full px-6 text-sm">
              {tHome("play")}
            </ButtonLink>
            <ButtonLink
              href="/signup"
              variant="link"
              size="lg"
              className="h-10 px-2 text-sm text-foreground"
            >
              {tHome("signup")}
              <ArrowRightIcon aria-hidden />
            </ButtonLink>
          </div>
        </div>

        <aside className="flex flex-col gap-6 border-border lg:border-l lg:pl-8">
          <div>
            <PongDemo
              className="bg-secondary text-secondary-foreground"
              ballClassName="bg-primary"
              paddleClassName="bg-secondary-foreground"
            />
          </div>
          <h2 className="font-display text-2xl italic">{t("featuresTitle")}</h2>
          <ol className="flex flex-col divide-y divide-border">
            {landingFeatures.map(({ key }, index) => (
              <li key={key} className="flex gap-4 py-4">
                <span className="font-display text-3xl text-primary">{index + 1}</span>
                <div>
                  <h3 className="font-display text-xl">{tHome(`features.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tHome(`features.${key}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </article>
    </div>
  )
}
