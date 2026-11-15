import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ProfileView } from "@/components/profile/profile-view"
import { currentSession, displayName, findProfile } from "@/lib/users"
import { usernameSchema } from "@/lib/validation/auth"

async function load(username: string) {
  if (!usernameSchema.safeParse(username).success) return null
  return findProfile(username)
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile/[username]">): Promise<Metadata> {
  const { locale, username } = await params
  const user = await load(username)
  if (user) return { title: displayName(user) }
  const t = await getTranslations({ locale: locale as Locale, namespace: "Profile" })
  return { title: t("notFoundTitle") }
}

// Any player's public profile: /profile/<username>.
export default async function PublicProfilePage({
  params,
}: PageProps<"/[locale]/profile/[username]">) {
  const { locale, username } = await params
  setRequestLocale(locale as Locale)

  const user = await load(username)
  if (!user) notFound()
  const session = await currentSession()

  return <ProfileView user={user} viewerId={session?.user.id ?? null} />
}
