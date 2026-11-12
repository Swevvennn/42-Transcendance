"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { ButtonLink } from "@/components/button-link"
import { OnlineGate } from "@/components/online/online-gate"
import { Button } from "@/components/ui/button"
import type { GameSocket } from "@/lib/pong/connection"
import { drawPong, HEIGHT, WIDTH, type Direction, type Side } from "@/lib/pong/engine"
import type { MatchFrame, MatchInfo } from "@/lib/pong/protocol"

// The client never simulates the online game: it sends its direction and
// draws what the server says. To look smooth despite network jitter, it
// draws slightly in the past (INTERP_DELAY_MS) and blends the two server
// frames around that moment (linear interpolation).

const INTERP_DELAY_MS = 50
const MAX_FRAMES = 30

type Role = Side | "spectator"

export function OnlineMatch({ matchId }: { matchId: string }) {
  return (
    <OnlineGate>
      {({ socket }) => <MatchView socket={socket} matchId={matchId} />}
    </OnlineGate>
  )
}

function MatchView({ socket, matchId }: { socket: GameSocket; matchId: string }) {
  const t = useTranslations("Match")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<MatchFrame[]>([])
  /** serverTime ≈ Date.now() + offset */
  const offsetRef = useRef<number | null>(null)
  const [load, setLoad] = useState<"loading" | "ready" | "notFound">("loading")
  const [role, setRole] = useState<Role>("spectator")
  const [info, setInfo] = useState<MatchInfo | null>(null)
  const [score, setScore] = useState({ left: 0, right: 0 })
  const [now, setNow] = useState(0)
  const [confirmForfeit, setConfirmForfeit] = useState(false)

  // Join the match, and join again after a network reconnection.
  useEffect(() => {
    const join = () =>
      socket.emit("match:join", matchId, (res) => {
        if (!res.ok) return setLoad("notFound")
        offsetRef.current = res.serverNow - Date.now()
        setRole(res.role)
        setInfo(res.info)
        setLoad("ready")
      })

    const onInfo = (next: MatchInfo) => {
      if (next.id === matchId) setInfo(next)
    }
    const onFrame = (frame: MatchFrame) => {
      // Keep the smallest observed delay as the clock offset.
      const sample = frame.t - Date.now()
      if (offsetRef.current === null || sample > offsetRef.current) {
        offsetRef.current = sample
      }
      const frames = framesRef.current
      frames.push(frame)
      if (frames.length > MAX_FRAMES) frames.shift()
      setScore((prev) =>
        prev.left === frame.score.left && prev.right === frame.score.right
          ? prev
          : frame.score
      )
    }

    join()
    socket.on("connect", join)
    socket.on("match:info", onInfo)
    socket.on("match:frame", onFrame)
    return () => {
      socket.off("connect", join)
      socket.off("match:info", onInfo)
      socket.off("match:frame", onFrame)
      socket.emit("match:leave", matchId)
    }
  }, [socket, matchId])

  // Keyboard → direction, sent only when it changes.
  useEffect(() => {
    if (role === "spectator") return
    const keys = new Set<string>()
    let sent: Direction = 0
    const send = () => {
      const up = keys.has("w") || keys.has("arrowup")
      const down = keys.has("s") || keys.has("arrowdown")
      const direction: Direction = up === down ? 0 : up ? -1 : 1
      if (direction !== sent) {
        sent = direction
        socket.emit("match:input", direction)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (["ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault()
      keys.add(e.key.toLowerCase())
      send()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase())
      send()
    }
    const onBlur = () => {
      keys.clear()
      send()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [socket, role])

  // Drawing loop.
  useEffect(() => {
    if (load !== "ready") return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    let raf = 0
    const draw = () => {
      const frames = framesRef.current
      if (frames.length > 0) {
        const renderTime = Date.now() + (offsetRef.current ?? 0) - INTERP_DELAY_MS
        drawPong(ctx, interpolate(frames, renderTime), getComputedStyle(canvas).color)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [load])

  // Refresh the countdowns shown in the overlay.
  useEffect(() => {
    if (!info?.deadline) return
    const tick = () => setNow(Date.now() + (offsetRef.current ?? 0))
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [info?.deadline])

  if (load === "loading") {
    return <p className="text-sm text-muted-foreground">{t("joining")}</p>
  }
  if (load === "notFound" || !info) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p>{t("notFound")}</p>
        <ButtonLink href="/play" variant="outline">
          {t("back")}
        </ButtonLink>
      </div>
    )
  }

  const seconds = info.deadline ? Math.max(0, Math.ceil((info.deadline - now) / 1000)) : 0
  const missing = (["left", "right"] as const).find((side) => !info.connected[side])
  const nameOf = (side: Side) => info.players[side].name
  const isPlayer = role !== "spectator"

  let message: string | null = null
  if (info.status === "waiting" && missing) {
    message = t("waiting", { name: nameOf(missing), seconds })
  } else if (info.status === "paused" && missing) {
    message = t("paused", { name: nameOf(missing), seconds })
  } else if (info.status === "countdown") {
    message = String(seconds)
  } else if (info.status === "over" && info.winner) {
    message = t(info.endReason === "forfeit" ? "winnerForfeit" : "winner", {
      name: nameOf(info.winner),
    })
  }

  const label = (side: Side) =>
    side === role ? t("you", { name: nameOf(side) }) : nameOf(side)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {isPlayer ? t("controls", { side: t(role) }) : t("spectating")}
      </p>
      <div className="flex justify-between text-sm">
        <span className="flex gap-2">
          <span>{label("left")}</span>
          <strong>{score.left}</strong>
        </span>
        <span className="flex gap-2">
          <strong>{score.right}</strong>
          <span>{label("right")}</span>
        </span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="aspect-[8/5] w-full border bg-muted text-foreground"
        />
        {message && (
          <p
            role="status"
            className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium"
          >
            <span className="bg-background/80 px-3 py-2">{message}</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {info.status === "over" ? (
          info.tournamentId ? (
            <ButtonLink href={`/play/tournament/${info.tournamentId}`}>
              {t("backToTournament")}
            </ButtonLink>
          ) : (
            <ButtonLink href="/play/online">{t("playAgain")}</ButtonLink>
          )
        ) : (
          isPlayer &&
          (confirmForfeit ? (
            <>
              <Button
                variant="destructive"
                onClick={() => socket.emit("match:forfeit", matchId)}
              >
                {t("forfeitConfirm")}
              </Button>
              <Button variant="outline" onClick={() => setConfirmForfeit(false)}>
                {t("cancel")}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirmForfeit(true)}>
              {t("forfeit")}
            </Button>
          ))
        )}
        <ButtonLink href="/play" variant="ghost">
          {t("back")}
        </ButtonLink>
      </div>
    </div>
  )
}

/** Position of every object at `time`, blended between two server frames. */
function interpolate(frames: MatchFrame[], time: number) {
  let i = frames.length - 1
  while (i > 0 && frames[i - 1].t > time) i--
  const b = frames[i]
  const a = frames[i - 1]
  if (!a || time >= b.t) return b
  if (time <= a.t) return a
  const k = (time - a.t) / (b.t - a.t)
  const lerp = (x: number, y: number) => x + (y - x) * k
  // After a goal the ball jumps to the center: don't slide it across.
  const jumped = Math.abs(b.ballX - a.ballX) > WIDTH / 4
  return {
    leftY: lerp(a.leftY, b.leftY),
    rightY: lerp(a.rightY, b.rightY),
    ballX: jumped ? b.ballX : lerp(a.ballX, b.ballX),
    ballY: jumped ? b.ballY : lerp(a.ballY, b.ballY),
  }
}
