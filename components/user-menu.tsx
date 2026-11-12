"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { ButtonLink } from "@/components/button-link"
import { Button } from "@/components/ui/button"
import { Link, useRouter } from "@/i18n/navigation"
import { signOut, useSession } from "@/lib/auth-client"
import { connectAs, disconnect } from "@/lib/pong/connection"

/** Header buttons: log in / sign up, or the player's name + log out. */
export function UserMenu() {
  const t = useTranslations("Nav")
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const userId = session?.user.id

  // Keep the game connection open on every page while logged in: that is
  // how the others see you "online" (lib/presence.ts), and how a tournament
  // can call you to your match.
  useEffect(() => {
    if (isPending) return
    if (userId) connectAs(userId)
    else disconnect()
  }, [userId, isPending])

  // Same output on the server and on the first client render (no flash of
  // the wrong buttons, no hydration mismatch).
  if (isPending) return null

  if (!session) {
    return (
      <>
        <ButtonLink href="/login" variant="outline">
          {t("login")}
        </ButtonLink>
        <ButtonLink href="/signup">{t("signup")}</ButtonLink>
      </>
    )
  }

  async function logout() {
    await signOut()
    disconnect() // close the game connection of the old session
    router.push("/")
    router.refresh()
  }

  return (
    <>
      <Link href="/profile" className="px-2 text-xs text-muted-foreground hover:underline">
        {session.user.displayUsername ?? session.user.name}
      </Link>
      <Button variant="outline" onClick={logout}>
        {t("logout")}
      </Button>
    </>
  )
}
