"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { ButtonLink } from "@/components/button-link"
import { LiveMatches } from "@/components/online/live-matches"
import { OnlineGate } from "@/components/online/online-gate"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import type { GameSocket } from "@/lib/pong/connection"
import type { ErrorCode } from "@/lib/pong/protocol"

export function OnlineLobby() {
  return (
    <OnlineGate>
      {({ socket, player }) => (
        <div className="flex flex-col gap-8">
          <Matchmaking socket={socket} />
          <LiveMatches socket={socket} player={player} />
        </div>
      )}
    </OnlineGate>
  )
}

function Matchmaking({ socket }: { socket: GameSocket }) {
  const t = useTranslations("Online")
  const router = useRouter()
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<ErrorCode | null>(null)

  useEffect(() => {
    // A match in progress (e.g. the tab was closed by mistake)? Offer to resume.
    socket.emit("session:get", (info) => setActiveMatchId(info.activeMatchId))

    const onMatched = ({ matchId }: { matchId: string }) => {
      router.push(`/play/match/${matchId}`)
    }
    socket.on("queue:matched", onMatched)
    return () => {
      socket.off("queue:matched", onMatched)
      // Leaving the page = no longer looking for an opponent.
      socket.emit("queue:leave")
    }
  }, [socket, router])

  function findMatch() {
    setError(null)
    setSearching(true)
    socket.emit("queue:join", (res) => {
      if (!res.ok) {
        setSearching(false)
        setError(res.error)
      }
    })
  }

  function cancel() {
    socket.emit("queue:leave")
    setSearching(false)
  }

  if (activeMatchId) {
    return (
      <Alert>
        <AlertTitle>{t("resume.title")}</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          <ButtonLink href={`/play/match/${activeMatchId}`}>{t("resume.action")}</ButtonLink>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {searching ? (
        <>
          <p role="status" className="text-sm">
            {t("queue.searching")}
          </p>
          <Button variant="outline" onClick={cancel}>
            {t("queue.cancel")}
          </Button>
        </>
      ) : (
        <Button onClick={findMatch}>{t("queue.find")}</Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}
    </div>
  )
}
