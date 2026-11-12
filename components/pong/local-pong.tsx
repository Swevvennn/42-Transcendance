"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import {
  drawPong,
  HEIGHT,
  initialState,
  serve,
  step,
  SUB_STEP,
  WIDTH,
  WIN_SCORE,
  type Direction,
  type PongState,
  type Side,
} from "@/lib/pong/engine"

// Local 2-player Pong, fully client-side. The physics live in
// lib/pong/engine.ts and are the same ones the online game server uses.

type Phase = "ready" | "playing" | "paused" | "over"

export function LocalPong() {
  const t = useTranslations("Game")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<PongState>(initialState())
  const keysRef = useRef(new Set<string>())
  const phaseRef = useRef<Phase>("ready")
  const [phase, setPhase] = useState<Phase>("ready")
  const [score, setScore] = useState({ left: 0, right: 0 })
  const [winner, setWinner] = useState<Side | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const changePhase = (next: Phase) => {
      phaseRef.current = next
      setPhase(next)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault()
      keysRef.current.add(e.key.toLowerCase())

      if (e.key !== " " || e.repeat) return
      const current = phaseRef.current
      if (current === "ready" || current === "over") {
        stateRef.current = initialState()
        serve(stateRef.current, Math.random() < 0.5 ? "left" : "right")
        setScore({ left: 0, right: 0 })
        setWinner(null)
        changePhase("playing")
      } else if (current === "playing") {
        changePhase("paused")
      } else {
        changePhase("playing")
      }
    }
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    const onBlur = () => {
      keysRef.current.clear()
      if (phaseRef.current === "playing") changePhase("paused")
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)

    const update = (dt: number) => {
      const s = stateRef.current
      const keys = keysRef.current
      const dir = (up: string, down: string): Direction =>
        keys.has(up) === keys.has(down) ? 0 : keys.has(up) ? -1 : 1

      const scorer = step(s, dt, {
        left: dir("w", "s"),
        right: dir("arrowup", "arrowdown"),
      })
      if (!scorer) return

      setScore(s.score)
      if (s.score[scorer] >= WIN_SCORE) {
        s.vx = 0
        s.vy = 0
        setWinner(scorer)
        changePhase("over")
      } else {
        serve(s, scorer === "left" ? "right" : "left")
      }
    }

    const draw = () => {
      // Colors come from the theme through the canvas' CSS.
      drawPong(ctx, stateRef.current, getComputedStyle(canvas).color)
    }

    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      // Small fixed sub-steps so a fast ball cannot pass through a paddle.
      let remaining = dt
      while (remaining > 0 && phaseRef.current === "playing") {
        const sub = Math.min(remaining, SUB_STEP)
        update(sub)
        remaining -= sub
      }
      draw()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [])

  const message =
    phase === "ready"
      ? t("pressStart")
      : phase === "paused"
        ? t("paused")
        : phase === "over" && winner
          ? t("winner", { player: t(winner) })
          : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span className="flex gap-2">
          <span>{t("left")}</span>
          <strong>{score.left}</strong>
        </span>
        <span className="flex gap-2">
          <strong>{score.right}</strong>
          <span>{t("right")}</span>
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
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium">
            <span className="bg-background/80 px-3 py-2">{message}</span>
          </p>
        )}
      </div>
    </div>
  )
}
