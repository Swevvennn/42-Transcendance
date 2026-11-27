"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  AI_LEVELS,
  aiInput,
  aiOnServe,
  createAi,
  type AiBrain,
  type AiLevel,
} from "@/lib/pong/ai"
import {
  drawPong,
  pongColors,
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

// Local Pong, fully client-side. The physics live in lib/pong/engine.ts and
// are the same ones the online game server uses.
// Two players on one keyboard, or (vsAi) one player against the AI of
// lib/pong/ai.ts, which plays the right paddle.

type Phase = "ready" | "playing" | "paused" | "over"

export function LocalPong({ vsAi = false }: { vsAi?: boolean }) {
  const t = useTranslations("Game")
  const tAi = useTranslations("AiGame")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<PongState>(initialState())
  const keysRef = useRef(new Set<string>())
  const phaseRef = useRef<Phase>("ready")
  const aiRef = useRef<AiBrain | null>(null)
  const levelRef = useRef<AiLevel>("normal")
  const [phase, setPhase] = useState<Phase>("ready")
  const [score, setScore] = useState({ left: 0, right: 0 })
  const [winner, setWinner] = useState<Side | null>(null)
  const [level, setLevel] = useState<AiLevel>("normal")

  const chooseLevel = (next: AiLevel) => {
    levelRef.current = next
    setLevel(next)
  }

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
        aiRef.current = vsAi ? createAi(levelRef.current, "right") : null
        serve(stateRef.current, Math.random() < 0.5 ? "left" : "right")
        if (aiRef.current) aiOnServe(aiRef.current)
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

      const ai = aiRef.current
      // Against the AI, the player may use W / S or the arrows.
      const left = ai
        ? dir("w", "s") || dir("arrowup", "arrowdown")
        : dir("w", "s")
      const right = ai ? aiInput(ai, s, dt) : dir("arrowup", "arrowdown")

      const scorer = step(s, dt, { left, right })
      if (!scorer) return

      setScore(s.score)
      if (s.score[scorer] >= WIN_SCORE) {
        s.vx = 0
        s.vy = 0
        setWinner(scorer)
        changePhase("over")
      } else {
        serve(s, scorer === "left" ? "right" : "left")
        if (ai) aiOnServe(ai)
      }
    }

    const draw = () => {
      // Colors come from the theme through the canvas' CSS.
      const { fg, ball } = pongColors(canvas)
      drawPong(ctx, stateRef.current, fg, ball)
    }

    let frame = 0
    let last: number | null = null
    const loop = (now: number) => {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05)
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
  }, [vsAi])

  const label = (side: Side) =>
    vsAi ? tAi(side === "left" ? "you" : "ai") : t(side)

  const message =
    phase === "ready"
      ? t("pressStart")
      : phase === "paused"
        ? t("paused")
        : phase === "over" && winner
          ? vsAi
            ? tAi(winner === "left" ? "youWin" : "aiWins")
            : t("winner", { player: t(winner) })
          : null

  return (
    <div className="flex flex-col gap-2">
      {vsAi && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span
            id="ai-level-label"
            className="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
          >
            {tAi("difficulty")}
          </span>
          <div role="group" aria-labelledby="ai-level-label" className="flex">
            {AI_LEVELS.map((key) => (
              <Button
                key={key}
                type="button"
                variant={level === key ? "default" : "outline"}
                size="lg"
                aria-pressed={level === key}
                disabled={phase === "playing"}
                onClick={(e) => {
                  chooseLevel(key)
                  // Keep Space for the game, not for re-clicking this button.
                  e.currentTarget.blur()
                }}
                className="px-4 text-sm"
              >
                {tAi(`levels.${key}`)}
              </Button>
            ))}
          </div>
          {phase !== "ready" && phase !== "over" && (
            <span className="text-xs text-muted-foreground">{tAi("levelNextGame")}</span>
          )}
        </div>
      )}
      <div dir="ltr" className="flex items-end justify-between">
        <span className="flex flex-col">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {label("left")}
          </span>
          <strong className="text-5xl font-black tracking-tighter tabular-nums">
            {score.left}
          </strong>
        </span>
        <span className="flex flex-col items-end">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {label("right")}
          </span>
          <strong className="text-5xl font-black tracking-tighter tabular-nums">
            {score.right}
          </strong>
        </span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="aspect-[8/5] w-full border-2 border-foreground bg-card text-foreground"
        />
        {message && (
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium">
            <span className="bg-foreground px-4 py-2 font-semibold text-background">{message}</span>
          </p>
        )}
      </div>
    </div>
  )
}
