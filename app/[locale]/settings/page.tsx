import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AvatarSettings, ProfileForm } from "@/components/settings/profile-settings"
import { TwoFactorSettings } from "@/components/settings/two-factor-settings"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  // have no password (and the 42 intra has its own 2FA).
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
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("avatar.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarSettings user={profile} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={profile} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("twoFactor.title")}</CardTitle>
          <CardDescription>{t("twoFactor.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {hasPassword ? (
            <TwoFactorSettings enabled={!!session.user.twoFactorEnabled} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("twoFactor.oauthOnly")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
