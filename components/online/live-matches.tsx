"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { ButtonLink } from "@/components/button-link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { GameSocket } from "@/lib/pong/connection"
import type { LiveMatch, PlayerRef } from "@/lib/pong/protocol"

/** Matches in progress, updated live, with a "Watch" button (spectator mode). */
export function LiveMatches({ socket, player }: { socket: GameSocket; player: PlayerRef }) {
  const t = useTranslations("Online.live")
  const [list, setList] = useState<LiveMatch[] | null>(null)

  useEffect(() => {
    socket.emit("matches:subscribe", setList)
    socket.on("matches:list", setList)
    return () => {
      socket.off("matches:list", setList)
      socket.emit("matches:unsubscribe")
    }
  }, [socket])

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      {list?.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {list?.map((match) => {
          const { left, right } = match.players
          const mine = left.id === player.id || right.id === player.id
          return (
            <Card key={match.id} size="sm">
              <CardHeader>
                <CardTitle>{t("versus", { left: left.name, right: right.name })}</CardTitle>
                <CardDescription>
                  {t("score", { left: match.score.left, right: match.score.right })}
                  {match.tournament && ` · ${t("tournament")}`}
                </CardDescription>
                <CardAction>
                  <Badge variant={match.status === "playing" ? "default" : "secondary"}>
                    {t(`status.${match.status}`)}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter>
                <ButtonLink
                  href={`/play/match/${match.id}`}
                  variant={mine ? "default" : "outline"}
                  size="sm"
                >
                  {mine ? t("resume") : t("watch")}
                </ButtonLink>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
