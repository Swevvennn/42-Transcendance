"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { ButtonLink } from "@/components/button-link"
import { OnlineGate } from "@/components/online/online-gate"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import type { GameSocket } from "@/lib/pong/connection"
import type {
  Ack,
  BracketMatch,
  ErrorCode,
  PlayerRef,
  TournamentInfo,
} from "@/lib/pong/protocol"
import { cn } from "@/lib/utils"

const MIN_PLAYERS = 3

export function TournamentView({ id }: { id: string }) {
  return (
    <OnlineGate>
      {({ socket, player }) => <Tournament socket={socket} player={player} id={id} />}
    </OnlineGate>
  )
}

function Tournament({
  socket,
  player,
  id,
}: {
  socket: GameSocket
  player: PlayerRef
  id: string
}) {
  const t = useTranslations("Tournament")
  const router = useRouter()
  const [info, setInfo] = useState<TournamentInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<ErrorCode | null>(null)

  useEffect(() => {
    const watch = () =>
      socket.emit("tournament:watch", id, (res) => {
        if (res.ok) setInfo(res.info)
        else setNotFound(true)
      })
    const onUpdate = (next: TournamentInfo) => {
      if (next.id === id) setInfo(next)
    }
    // When one of my games is created, go straight to it.
    const onMatchReady = (p: { tournamentId: string; matchId: string }) => {
      if (p.tournamentId === id) router.push(`/play/match/${p.matchId}`)
    }

    watch()
    socket.on("connect", watch)
    socket.on("tournament:update", onUpdate)
    socket.on("tournament:matchReady", onMatchReady)
    return () => {
      socket.off("connect", watch)
      socket.off("tournament:update", onUpdate)
      socket.off("tournament:matchReady", onMatchReady)
      socket.emit("tournament:unwatch", id)
    }
  }, [socket, id, router])

  if (notFound) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p>{t("notFound")}</p>
        <ButtonLink href="/play/tournament" variant="outline">
          {t("back")}
        </ButtonLink>
      </div>
    )
  }
  if (!info) return null

  const send = (event: "tournament:join" | "tournament:leave" | "tournament:start") => {
    setError(null)
    socket.emit(event, id, (res: Ack) => {
      if (!res.ok) setError(res.error)
    })
  }

  const joined = info.players.some((p) => p.id === player.id)
  const isHost = info.hostId === player.id
  // A game of mine that exists but is not finished yet.
  const myMatch = info.rounds
    .flat()
    .find(
      (m) => m.matchId && !m.winnerId && m.players.some((p) => p?.id === player.id)
    )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{info.name}</h2>
        <Badge variant={info.status === "lobby" ? "default" : "secondary"}>
          {t(`status.${info.status}`)}
        </Badge>
      </div>

      {info.winner && (
        <Alert>
          <AlertTitle>{t("champion", { name: info.winner.name })}</AlertTitle>
        </Alert>
      )}

      {myMatch?.matchId && (
        <Alert>
          <AlertTitle>{t("yourMatch")}</AlertTitle>
          <AlertDescription>
            <ButtonLink href={`/play/match/${myMatch.matchId}`}>{t("play")}</ButtonLink>
          </AlertDescription>
        </Alert>
      )}

      {info.status === "lobby" && (
        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">
            {t("players", { count: info.players.length, max: info.maxPlayers })}
          </h3>
          <ul className="flex flex-col gap-1 text-sm">
            {info.players.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                {p.name}
                {p.id === info.hostId && <Badge variant="outline">{t("host")}</Badge>}
                {p.id === player.id && (
                  <span className="text-muted-foreground">{t("you")}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {t("lobbyHint", { min: MIN_PLAYERS })}
          </p>
          <div className="flex flex-wrap gap-2">
            {joined ? (
              <Button variant="outline" onClick={() => send("tournament:leave")}>
                {t("leave")}
              </Button>
            ) : (
              <Button onClick={() => send("tournament:join")}>{t("join")}</Button>
            )}
            {isHost && (
              <Button
                onClick={() => send("tournament:start")}
                disabled={info.players.length < MIN_PLAYERS}
              >
                {t("start")}
              </Button>
            )}
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}

      {info.rounds.length > 0 && <Bracket info={info} me={player.id} />}

      <ButtonLink href="/play/tournament" variant="ghost" className="self-start">
        {t("back")}
      </ButtonLink>
    </div>
  )
}

function Bracket({ info, me }: { info: TournamentInfo; me: string }) {
  const t = useTranslations("Tournament")
  const roundName = (index: number) => {
    const fromEnd = info.rounds.length - 1 - index
    if (fromEnd === 0) return t("round.final")
    if (fromEnd === 1) return t("round.semi")
    return t("round.quarter")
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-semibold">{t("bracket")}</h3>
      <div className="grid gap-4 overflow-x-auto sm:auto-cols-fr sm:grid-flow-col">
        {info.rounds.map((games, round) => (
          <div key={round} className="flex flex-col justify-around gap-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase">
              {roundName(round)}
            </h4>
            {games.map((game, index) => (
              <BracketGame key={index} game={game} me={me} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function BracketGame({ game, me }: { game: BracketMatch; me: string }) {
  const t = useTranslations("Tournament")
  const live = game.matchId && !game.winnerId

  return (
    <div className="flex flex-col border text-sm">
      {game.players.map((p, slot) => (
        <div
          key={slot}
          className={cn(
            "flex justify-between gap-2 px-2 py-1",
            slot === 0 && "border-b",
            p && game.winnerId === p.id && "font-semibold",
            p && game.winnerId && game.winnerId !== p.id && "text-muted-foreground line-through"
          )}
        >
          <span>
            {p ? p.name : game.bye ? t("bye") : t("tbd")}
            {p?.id === me && <span className="text-muted-foreground"> {t("you")}</span>}
          </span>
          {game.score && <span>{game.score[slot]}</span>}
        </div>
      ))}
      {live && game.matchId && (
        <ButtonLink
          href={`/play/match/${game.matchId}`}
          variant="ghost"
          size="xs"
          className="justify-start"
        >
          {t("watch")}
        </ButtonLink>
      )}
    </div>
  )
}
