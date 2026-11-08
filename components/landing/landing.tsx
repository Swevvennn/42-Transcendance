import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import { useTranslations } from "next-intl"
import { Fragment, type CSSProperties } from "react"

import { ButtonLink } from "@/components/button-link"
import { AnimeIntro } from "@/components/landing/anime-intro"
import { AttractPong } from "@/components/landing/attract-pong"
import { Anime3DIntro } from "@/components/landing/anime3d/intro"
import { isAnime, isAnime3D, type LandingMotion } from "@/components/landing/motion"
import { cn } from "@/lib/utils"

const index = (i: number) => ({ "--i": i }) as CSSProperties

// Swiss landing page. `motion` picks an animation (CSS in app/landing-motion.css,
// keyed on `data-motion`); without it the page is static.
export function Landing({
  motion,
  introOnce = false,
}: {
  motion?: LandingMotion
  /** 3D intros: the full cut only once per session, then just the loader. */
  introOnce?: boolean
}) {
  const t = useTranslations("Home")
  const headline = t("headline")
  const anime = isAnime(motion)
  // Anime variants show the Swiss block logo; the intro's ball lands in it.
  const half = Math.ceil(headline.length / 2)

  return (
    <div className="flex flex-col" data-motion={motion} data-anime={anime || undefined}>
      {isAnime3D(motion) && (
        <Anime3DIntro
          variant={motion}
          name={headline}
          sfx={t("introSfx")}
          skipLabel={t("introSkip")}
          loadingLabel={t("introLoading")}
          once={introOnce}
        />
      )}
      {motion === "anime" && (
        <AnimeIntro
          name={headline}
          sfx={t("introSfx")}
          skipLabel={t("introSkip")}
          loadingLabel={t("introLoading")}
        />
      )}
      {/* Fills the screen below the header; wider than <main> on large screens. */}
      <section className="relative isolate flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-10 md:flex-row md:gap-12 lg:mx-[calc((100%-min(94vw,92rem))/2)] lg:gap-20">
        {motion === "assemble" && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 grid grid-cols-12 gap-4"
            aria-hidden
          >
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="lp-guide border-x border-primary/30 bg-primary/5" style={index(i)} />
            ))}
          </div>
        )}

        <p className="lp-vertical hidden rotate-180 text-xs font-semibold tracking-widest text-muted-foreground uppercase [writing-mode:vertical-rl] lg:block">
          {t("vertical")}
        </p>

        <div className="flex min-w-0 flex-col items-center gap-6 text-center md:items-start md:gap-8 md:text-start">
          <p className="lp-kicker text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t("kicker")}
          </p>
          {anime ? (
            <h1
              dir="ltr"
              className="lp-block relative flex size-[2.78em] flex-col justify-end bg-foreground p-[0.09em] text-left text-[min(30vw,8rem)] text-background uppercase md:text-[clamp(6rem,min(17vh,15vw),12rem)]"
              aria-label={headline}
            >
              <span className="leading-[0.82] font-black tracking-tighter" aria-hidden>
                {Array.from(headline).map((letter, i) => (
                  <Fragment key={i}>
                    {i === half && <br />}
                    <span className="lp-letter inline-block" style={index(i)}>
                      {letter}
                    </span>
                  </Fragment>
                ))}
              </span>
              <span
                className="lp-block-ball absolute top-[0.25em] right-[0.25em] size-[0.45em] rounded-full bg-primary"
                aria-hidden
              />
            </h1>
          ) : (
            <h1
              dir="ltr"
              className="lp-headline text-[min(20vw,7rem)] leading-[0.8] font-black tracking-tighter md:text-[min(11vw,12rem)]"
              aria-label={`${headline}.`}
            >
              {Array.from(headline).map((letter, i) => (
                <span key={i} className="lp-letter inline-block" style={index(i)} aria-hidden>
                  {letter}
                </span>
              ))}
              <span className="lp-dot inline-block text-primary" aria-hidden>
                .
              </span>
            </h1>
          )}
          <p className="lp-tagline max-w-lg text-2xl leading-tight font-semibold tracking-tight lg:text-3xl">
            {t("tagline")}
          </p>
          <p className="lp-subtitle max-w-lg text-muted-foreground lg:text-lg">{t("subtitle")}</p>
          <div className="lp-cta flex flex-wrap justify-center gap-2 md:justify-start">
            <ButtonLink href="/play" size="lg" className="h-12 px-6 text-sm font-semibold">
              {t("play")}
              <ArrowRightIcon weight="bold" className="rtl:rotate-180" aria-hidden />
            </ButtonLink>
            <ButtonLink
              href="/signup"
              variant="secondary"
              size="lg"
              className="h-12 px-6 text-sm font-semibold"
            >
              {t("signup")}
            </ButtonLink>
          </div>
        </div>

        {/* The match is desktop only. */}
        <div className="lp-court-wrap hidden shrink-0 flex-col gap-3 md:flex md:w-[min(36rem,60vh,42vw)]">
          {motion === "attract" || anime ? (
            <AttractPong hint={t("attractHint")} />
          ) : (
            <LandingCourt motion={motion} />
          )}
        </div>
      </section>
    </div>
  )
}

// Abstract court: two paddles and a red ball on the grid. Animated by the
// surrounding `data-motion` (Rally makes it play by itself).
export function LandingCourt({
  motion,
  compact = false,
}: {
  motion?: LandingMotion
  /** Thin paddles for small previews. */
  compact?: boolean
}) {
  const paddle = compact ? "w-1.5" : "w-3"
  return (
    <div
      className="lp-court relative aspect-square"
      // Paddle width, used by the Rally keyframes.
      style={compact ? ({ "--w": "6px" } as CSSProperties) : undefined}
      aria-hidden
    >
      <div className="lp-net absolute inset-y-0 left-1/2 w-px bg-border" />
      <div className={cn("lp-paddle lp-paddle-l absolute top-0 left-0 h-1/2 bg-foreground", paddle)} />
      <div className={cn("lp-paddle lp-paddle-r absolute right-0 bottom-0 h-1/3 bg-foreground", paddle)} />
      {motion === "rally" && (
        <>
          <div className="lp-ball lp-ghost lp-ghost-2 absolute aspect-square rounded-full bg-primary" />
          <div className="lp-ball lp-ghost lp-ghost-1 absolute aspect-square rounded-full bg-primary" />
        </>
      )}
      <div className="lp-ball absolute top-[30%] left-[35%] aspect-square w-[45%] rounded-full bg-primary" />
    </div>
  )
}
