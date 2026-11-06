import { ArrowLeftIcon } from "@phosphor-icons/react/ssr"
import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { characterStyles } from "@/components/landing/anime3d/rig"
import { PageHeader } from "@/components/page-header"
import { CharacterLab } from "@/components/templates/character-lab"
import { Link } from "@/i18n/navigation"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/templates/characters">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Templates" })
  return { title: `${t("characters.title")} · ${t("title")}` }
}

// Character lab: 3D prototypes of the two school boys in several model
// styles, to pick the one the anime intro will animate.
export default async function CharactersPage({
  params,
}: PageProps<"/[locale]/templates/characters">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Templates")

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/templates"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon aria-hidden />
        {t("back")}
      </Link>
      <PageHeader title={t("characters.title")} description={t("characters.description")} />
      <CharacterLab
        styles={characterStyles.map((id) => ({
          id,
          name: t(`characters.styles.${id}.name`),
          description: t(`characters.styles.${id}.description`),
        }))}
        labels={{
          pose: t("characters.pose"),
          poses: {
            ready: t("characters.poses.ready"),
            swing: t("characters.poses.swing"),
            smash: t("characters.poses.smash"),
          },
          view: t("characters.view"),
          views: { body: t("characters.views.body"), face: t("characters.views.face") },
          screentone: t("characters.screentone"),
          hint: t("characters.hint"),
          hero: t("characters.hero"),
          rival: t("characters.rival"),
        }}
      />
    </div>
  )
}
