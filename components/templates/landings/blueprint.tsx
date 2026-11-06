import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"
import { landingFeatures } from "@/components/templates/features"
import { PongDemo } from "@/components/templates/pong-demo"
import { cn } from "@/lib/utils"

const blueprintButton =
  "h-11 rounded-none border border-foreground px-5 text-sm uppercase tracking-widest"

// Engineering-style dimension line with end ticks.
function Dimension({ label, vertical = false }: { label: string; vertical?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-accent",
        vertical && "flex-col [writing-mode:vertical-rl]",
      )}
      aria-hidden
    >
      <span className={cn("bg-accent", vertical ? "h-px w-3" : "h-3 w-px")} />
      <span className={cn("flex-1 bg-accent", vertical ? "w-px" : "h-px")} />
      <span>{label}</span>
      <span className={cn("flex-1 bg-accent", vertical ? "w-px" : "h-px")} />
      <span className={cn("bg-accent", vertical ? "h-px w-3" : "h-3 w-px")} />
    </div>
  )
}

export function BlueprintLanding() {
  const t = useTranslations("Templates.styles.blueprint")
  const tHome = useTranslations("Home")

  const titleBlock = [
    { label: t("project"), value: tHome("title"), wide: true },
    { label: t("drawnBy"), value: t("drawnByValue"), wide: true },
    { label: t("sheet"), value: "1 / 1" },
    { label: t("scale"), value: "1:1" },
    { label: t("revision"), value: "A" },
  ]

  const legend = [
    { mark: "A", label: t("paddle") },
    { mark: "B", label: t("ball") },
    { mark: "C", label: t("net") },
  ]

  return (
    <div className="blueprint-grid">
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs tracking-widest text-accent uppercase">{t("figure")}</p>
          <h1 className="font-display text-5xl font-bold tracking-wide uppercase sm:text-7xl">
            {tHome("title")}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {tHome("subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/play" className={blueprintButton}>
              {tHome("play")}
            </ButtonLink>
            <ButtonLink
              href="/signup"
              variant="outline"
              className={cn(
                blueprintButton,
                "bg-transparent hover:bg-foreground/10 dark:border-foreground dark:bg-transparent",
              )}
            >
              {tHome("signup")}
            </ButtonLink>
          </div>
        </div>

        <figure className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Dimension label="800" />
            <span />
            <div className="relative border border-dashed border-foreground">
              <PongDemo className="text-foreground" ballClassName="rounded-full" />
              <span className="absolute top-2 left-[7%] text-xs text-accent" aria-hidden>A</span>
              <span className="absolute top-2 left-[52%] text-xs text-accent" aria-hidden>C</span>
            </div>
            <Dimension label="450" vertical />
          </div>
          <figcaption className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            {legend.map(({ mark, label }) => (
              <span key={mark}>
                <span className="text-accent">{mark}</span> — {label}
              </span>
            ))}
          </figcaption>
        </figure>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">
            {t("featuresTitle")}
          </h2>
          <ul className="flex flex-col">
            {landingFeatures.map(({ key, Icon }, index) => (
              <li
                key={key}
                className="grid grid-cols-[3rem_1fr_auto] items-start gap-4 border-t border-dashed border-border py-4"
              >
                <span className="text-xs text-accent">1.{index + 1}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold uppercase">
                    {tHome(`features.${key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tHome(`features.${key}.description`)}
                  </p>
                </div>
                <Icon className="size-6" weight="thin" aria-hidden />
              </li>
            ))}
          </ul>
        </div>

        {/* Title block, like the corner of a technical drawing. */}
        <dl className="grid grid-cols-3 border border-foreground bg-card text-xs">
          {titleBlock.map(({ label, value, wide }) => (
            <div
              key={label}
              className={cn(
                "flex flex-col gap-1 border-foreground p-3",
                wide ? "col-span-3 border-b" : "border-r last:border-r-0",
              )}
            >
              <dt className="text-[10px] tracking-widest text-muted-foreground uppercase">
                {label}
              </dt>
              <dd className="font-display text-sm font-semibold uppercase">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
