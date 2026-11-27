import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"
import { landingFeatures } from "@/components/templates/features"

// Static ASCII court (decorative, not text content).
const court = String.raw`+--------------------------------------+
|                  :                   |
| |                :                   |
| |                :         o         |
| |                :                 | |
|                  :                 | |
|                  :                 | |
+--------------------------------------+`

const termButton =
  "h-auto rounded-none border border-border bg-transparent px-3 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground dark:bg-transparent"

export function TerminalLanding() {
  const t = useTranslations("Templates.styles.terminal")
  const tHome = useTranslations("Home")
  const tNav = useTranslations("Nav")

  return (
    <div className="terminal-glow mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12">
      <section className="terminal-crt border border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2" aria-hidden>
          <span className="size-2.5 rounded-full bg-accent" />
          <span className="size-2.5 rounded-full bg-muted-foreground" />
          <span className="size-2.5 rounded-full bg-primary" />
        </div>

        <div className="flex flex-col gap-4 p-4 text-sm sm:p-6">
          <p>
            <span className="text-accent">guest@42lehavre</span>
            <span className="text-muted-foreground">:~$ </span>
            {t("command")}
          </p>
          <p className="text-muted-foreground">
            [ <span className="text-primary">{t("ok")}</span> ] {t("boot")}
          </p>

          <h1 className="font-display text-3xl font-bold tracking-tight uppercase sm:text-5xl">
            {tHome("title")}
          </h1>
          <p className="text-muted-foreground">{tHome("subtitle")}</p>

          <pre className="overflow-x-auto text-xs leading-tight text-primary sm:text-sm" aria-hidden>
            {court}
          </pre>

          <p className="text-accent">{t("ready")}</p>

          <div>
            <p className="mb-3 text-muted-foreground">{"// "}{t("hint")}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/play" className={termButton}>
                [ {tHome("play")} ]
              </ButtonLink>
              <ButtonLink href="/signup" className={termButton}>
                [ {tHome("signup")} ]
              </ButtonLink>
              <ButtonLink href="/leaderboard" className={termButton}>
                [ {tNav("leaderboard")} ]
              </ButtonLink>
            </div>
          </div>

          <p>
            <span className="text-accent">guest@42lehavre</span>
            <span className="text-muted-foreground">:~$ </span>
            <span className="terminal-cursor" aria-hidden />
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm text-accent uppercase">## {t("featuresTitle")}</h2>
        <ul className="flex flex-col gap-3 text-sm">
          {landingFeatures.map(({ key }) => (
            <li key={key} className="border-l-2 border-primary pl-4">
              <p>
                [ <span className="text-primary">{t("ok")}</span> ]{" "}
                <span className="font-bold">{tHome(`features.${key}.title`)}</span>
              </p>
              <p className="text-muted-foreground">
                {tHome(`features.${key}.description`)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
