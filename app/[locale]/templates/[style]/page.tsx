import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BlueprintLanding } from "@/components/templates/landings/blueprint"
import { BrutalistLanding } from "@/components/templates/landings/brutalist"
import { EditorialLanding } from "@/components/templates/landings/editorial"
import { RisoLanding } from "@/components/templates/landings/riso"
import { SwissLanding } from "@/components/templates/landings/swiss"
import { TerminalLanding } from "@/components/templates/landings/terminal"
import {
  isTemplateStyle,
  templateStyles,
  type TemplateStyle,
} from "@/components/templates/registry"
import { TemplateShell } from "@/components/templates/template-shell"

const landings: Record<TemplateStyle, () => React.JSX.Element> = {
  brutalist: BrutalistLanding,
  editorial: EditorialLanding,
  terminal: TerminalLanding,
  swiss: SwissLanding,
  riso: RisoLanding,
  blueprint: BlueprintLanding,
}

export const dynamicParams = false

export function generateStaticParams() {
  return templateStyles.map((style) => ({ style }))
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/templates/[style]">): Promise<Metadata> {
  const { locale, style } = await params
  if (!isTemplateStyle(style)) return {}
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Templates",
  })
  return { title: `${t(`styles.${style}.name`)} · ${t("title")}` }
}

export default async function TemplateLandingPage({
  params,
}: PageProps<"/[locale]/templates/[style]">) {
  const { locale, style } = await params
  setRequestLocale(locale as Locale)
  if (!isTemplateStyle(style)) notFound()

  const Landing = landings[style]
  return (
    <TemplateShell style={style}>
      <Landing />
    </TemplateShell>
  )
}
