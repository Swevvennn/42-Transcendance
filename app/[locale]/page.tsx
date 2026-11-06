import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import { Landing } from "@/components/landing/landing"

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  // The manga 3D intro (cel-shaded smash, ball flies into the Stack logo) on
  // the first visit of the session; later loads only show the loader, whose
  // logo then falls into the page's.
  return <Landing motion="manga" introOnce />
}
