"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { ButtonLink } from "@/components/button-link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSession } from "@/lib/auth-client"
import { useConnection, type GameSocket } from "@/lib/pong/connection"
import type { PlayerRef } from "@/lib/pong/protocol"

type Online = { socket: GameSocket; player: PlayerRef }

/**
 * Online pages need an account. Shows a "log in" card or the connection
 * status, and renders `children` only once connected to the game server.
 */
export function OnlineGate({ children }: { children: (online: Online) => ReactNode }) {
  const t = useTranslations("Online")
  const { data: session, isPending } = useSession()
  // The connection itself is opened by the header (components/user-menu.tsx).
  const connection = useConnection()

  if (isPending) return null

  if (!session) {
    return (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>{t("loginRequired.title")}</CardTitle>
          <CardDescription>{t("loginRequired.description")}</CardDescription>
        </CardHeader>
        <CardFooter className="gap-2">
          <ButtonLink href="/login">{t("loginRequired.login")}</ButtonLink>
          <ButtonLink href="/signup" variant="outline">
            {t("loginRequired.signup")}
          </ButtonLink>
        </CardFooter>
      </Card>
    )
  }

  switch (connection.status) {
    case "idle":
    case "connecting":
      return <p className="text-sm text-muted-foreground">{t("connecting")}</p>
    case "error":
      return (
        <Alert variant="destructive">
          <AlertDescription>{t("connectionError")}</AlertDescription>
        </Alert>
      )
    case "connected": {
      const { user } = session
      const player = { id: user.id, name: user.displayUsername ?? user.name }
      return <>{children({ socket: connection.socket, player })}</>
    }
  }
}
