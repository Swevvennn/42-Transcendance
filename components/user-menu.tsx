"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { ButtonLink } from "@/components/button-link"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import { signOut, useSession } from "@/lib/auth-client"
import { connectAs, disconnect } from "@/lib/pong/connection"

/**
 * Header buttons: log in / sign up, or the player's name + log out.
 * `mobile` renders the full-width rows of the mobile panel; only the desktop
 * instance keeps the game connection (it is always mounted).
 */
export function UserMenu({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean
  onNavigate?: () => void
}) {
  const t = useTranslations("Nav")
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const userId = session?.user.id
  const linkClass = mobile
    ? "h-11 w-full justify-start text-base font-semibold"
    : "text-sm font-semibold"

  // Keep the game connection open on every page while logged in: that is
  // how the others see you "online" (lib/presence.ts), and how a tournament
  // can call you to your match.
  useEffect(() => {
    if (mobile || isPending) return
    if (userId) connectAs(userId)
    else disconnect()
  }, [mobile, userId, isPending])

  // Same output on the server and on the first client render (no flash of
  // the wrong buttons, no hydration mismatch).
  if (isPending) return null

  if (!session) {
    return (
      <>
        <ButtonLink href="/login" variant="ghost" className={linkClass} onClick={onNavigate}>
          {t("login")}
        </ButtonLink>
        <ButtonLink href="/signup" className={linkClass} onClick={onNavigate}>
          {t("signup")}
        </ButtonLink>
      </>
    )
  }

  async function logout() {
    onNavigate?.()
    await signOut()
    disconnect() // close the game connection of the old session
    router.push("/")
    router.refresh()
  }

  return (
    <>
      <ButtonLink href="/profile" variant="ghost" className={linkClass} onClick={onNavigate}>
        {session.user.displayUsername ?? session.user.name}
      </ButtonLink>
      <Button variant="outline" className={linkClass} onClick={logout}>
        {t("logout")}
      </Button>
    </>
  )
}
