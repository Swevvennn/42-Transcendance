import { ArrowLeftIcon } from "@phosphor-icons/react/ssr"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Landing } from "@/components/landing/landing"
import { isLandingMotion, landingMotions } from "@/components/landing/motion"
import { MotionPreview } from "@/components/landing/motion-preview"
import { Link } from "@/i18n/navigation"

export const dynamicParams = false

export function generateStaticParams() {
  return landingMotions.map((variant) => ({ variant }))
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/templates/motion/[variant]">): Promise<Metadata> {
  const { locale, variant } = await params
  if (!isLandingMotion(variant)) return {}
  const t = await getTranslations({ locale: locale as Locale, namespace: "Templates" })
  return { title: `${t(`motion.${variant}.name`)} · ${t("title")}` }
}

// Preview of the landing page with one animation variant, inside the real
// site layout so it looks exactly like the home page would.
export default async function MotionVariantPage({
  params,
}: PageProps<"/[locale]/templates/motion/[variant]">) {
  const { locale, variant } = await params
  setRequestLocale(locale as Locale)
  if (!isLandingMotion(variant)) notFound()
  const t = await getTranslations("Templates")

  return (
    <MotionPreview
      replayLabel={t("replay")}
      toolbar={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon aria-hidden />
            {t("back")}
          </Link>
          <span className="inline-flex items-center gap-2 font-semibold">
            <span className="size-2 rounded-full bg-primary" aria-hidden />
            {t(`motion.${variant}.name`)}
          </span>
          <span className="hidden text-muted-foreground md:inline">
            {t(`motion.${variant}.description`)}
          </span>
        </div>
      }
    >
      <Landing motion={variant} />
    </MotionPreview>
  )
}
