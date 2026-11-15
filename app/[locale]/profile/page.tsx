import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ProfileView } from "@/components/profile/profile-view"
import { redirect } from "@/i18n/navigation"
import { currentSession, findProfileById } from "@/lib/users"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Profile" })
  return { title: t("title") }
}

// Your own profile (rendered on the server for each request: it reads the
// session cookie and the database). Visitors are sent to the login page.
export default async function ProfilePage({ params }: PageProps<"/[locale]/profile">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const session = await currentSession()
  const user = session && (await findProfileById(session.user.id))
  if (!user) return redirect({ href: "/login", locale: locale as Locale })

  return <ProfileView user={user} viewerId={user.id} />
}
