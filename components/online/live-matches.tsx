"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { ButtonLink } from "@/components/button-link"
import { SwissSection } from "@/components/swiss-section"
import { Badge } from "@/components/ui/badge"
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
    <SwissSection title={t("title")} description={t("description")}>
      {list?.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
      <ul className="flex flex-col">
        {list?.map((match) => {
          const { left, right } = match.players
          const mine = left.id === player.id || right.id === player.id
          return (
            <li
              key={match.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border py-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">{t("versus", { left: left.name, right: right.name })}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {t("score", { left: match.score.left, right: match.score.right })}
                  {match.tournament && ` · ${t("tournament")}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={match.status === "playing" ? "default" : "outline"}>
                  {t(`status.${match.status}`)}
                </Badge>
                <ButtonLink
                  href={`/play/match/${match.id}`}
                  variant={mine ? "default" : "outline"}
                  size="sm"
                >
                  {mine ? t("resume") : t("watch")}
                </ButtonLink>
              </div>
            </li>
          )
        })}
      </ul>
    </SwissSection>
  )
}
