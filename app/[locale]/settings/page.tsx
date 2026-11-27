import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { PasswordSettings } from "@/components/settings/password-settings"
import { AvatarSettings, ProfileForm } from "@/components/settings/profile-settings"
import { TwoFactorSettings } from "@/components/settings/two-factor-settings"
import { PageHeader } from "@/components/page-header"
import { SwissSection } from "@/components/swiss-section"
import { redirect } from "@/i18n/navigation"
import { prisma } from "@/lib/prisma"
import { currentSession } from "@/lib/users"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Settings" })
  return { title: t("title") }
}

// Account settings (logged-in users only).
export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Settings")

  const session = await currentSession()
  if (!session) return redirect({ href: "/login", locale: locale as Locale })

  // 2FA is asked at the email + password login. Accounts created with 42
  // have no password to change (and the 42 intra has its own 2FA).
  const hasPassword = !!(await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { id: true },
  }))

  const { user } = session
  const profile = {
    id: user.id,
    name: user.displayUsername ?? user.username ?? user.name,
    username: user.username ?? user.name,
    email: user.email,
    image: user.image ?? null,
  }

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("title")} description={t("description")} className="border-b-0 pb-0" />
      <SwissSection title={t("avatar.title")}>
        <AvatarSettings user={profile} />
      </SwissSection>
      <SwissSection title={t("profile.title")} description={t("profile.description")}>
        <ProfileForm user={profile} hasPassword={hasPassword} />
      </SwissSection>
      <SwissSection title={t("password.title")} description={t("password.description")}>
        {hasPassword ? (
          <PasswordSettings />
        ) : (
          <p className="text-sm text-muted-foreground">{t("password.oauthOnly")}</p>
        )}
      </SwissSection>
      <SwissSection title={t("twoFactor.title")} description={t("twoFactor.description")}>
        {hasPassword ? (
          <TwoFactorSettings enabled={!!session.user.twoFactorEnabled} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("twoFactor.oauthOnly")}</p>
        )}
      </SwissSection>
    </div>
  )
}
