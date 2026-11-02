"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

// Local 2-player Pong, fully client-side. This is only a preview: online
// games will run on the server (~60 ticks/s) and the client will just render.

const WIDTH = 800
const HEIGHT = 500
const PADDLE_W = 12
const PADDLE_H = 90
const PADDLE_MARGIN = 24
const PADDLE_SPEED = 450 // px/s
const BALL_SIZE = 12
const BALL_SPEED = 380 // px/s
const BALL_SPEED_MAX = 900
const WIN_SCORE = 5

type Phase = "ready" | "playing" | "paused" | "over"
type Side = "left" | "right"

type State = {
  leftY: number
  rightY: number
  ballX: number
  ballY: number
  vx: number
  vy: number
  score: { left: number; right: number }
}

function initialState(): State {
  return {
    leftY: (HEIGHT - PADDLE_H) / 2,
    rightY: (HEIGHT - PADDLE_H) / 2,
    ballX: (WIDTH - BALL_SIZE) / 2,
    ballY: (HEIGHT - BALL_SIZE) / 2,
    vx: 0,
    vy: 0,
    score: { left: 0, right: 0 },
  }
}

// Puts the ball back in the center, heading towards `towards`.
function serve(s: State, towards: Side) {
  const angle = (Math.random() - 0.5) * (Math.PI / 3) // ±30°
  const dir = towards === "left" ? -1 : 1
  s.ballX = (WIDTH - BALL_SIZE) / 2
  s.ballY = (HEIGHT - BALL_SIZE) / 2
  s.vx = Math.cos(angle) * BALL_SPEED * dir
  s.vy = Math.sin(angle) * BALL_SPEED
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

export function LocalPong() {
  const t = useTranslations("Game")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<State>(initialState())
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
      const move = PADDLE_SPEED * dt
      const maxY = HEIGHT - PADDLE_H

      if (keys.has("w")) s.leftY -= move
      if (keys.has("s")) s.leftY += move
      if (keys.has("arrowup")) s.rightY -= move
      if (keys.has("arrowdown")) s.rightY += move
      s.leftY = clamp(s.leftY, 0, maxY)
      s.rightY = clamp(s.rightY, 0, maxY)

      s.ballX += s.vx * dt
      s.ballY += s.vy * dt

      // Top / bottom walls.
      if (s.ballY <= 0 || s.ballY >= HEIGHT - BALL_SIZE) {
        s.ballY = clamp(s.ballY, 0, HEIGHT - BALL_SIZE)
        s.vy = -s.vy
      }

      // Paddles: bounce angle depends on where the ball hits.
      const hit = (paddleX: number, paddleY: number, dir: 1 | -1) => {
        const overlapX = s.ballX < paddleX + PADDLE_W && s.ballX + BALL_SIZE > paddleX
        const overlapY = s.ballY < paddleY + PADDLE_H && s.ballY + BALL_SIZE > paddleY
        if (!overlapX || !overlapY || Math.sign(s.vx) === dir) return
        const offset =
          (s.ballY + BALL_SIZE / 2 - (paddleY + PADDLE_H / 2)) / (PADDLE_H / 2)
        const angle = offset * (Math.PI / 4) // up to ±45°
        const speed = Math.min(Math.hypot(s.vx, s.vy) * 1.05, BALL_SPEED_MAX)
        s.vx = Math.cos(angle) * speed * dir
        s.vy = Math.sin(angle) * speed
        s.ballX = dir === 1 ? paddleX + PADDLE_W : paddleX - BALL_SIZE
      }
      hit(PADDLE_MARGIN, s.leftY, 1)
      hit(WIDTH - PADDLE_MARGIN - PADDLE_W, s.rightY, -1)

      // Goals.
      let scorer: Side | null = null
      if (s.ballX + BALL_SIZE < 0) scorer = "right"
      else if (s.ballX > WIDTH) scorer = "left"
      if (!scorer) return

      s.score = { ...s.score, [scorer]: s.score[scorer] + 1 }
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
      const s = stateRef.current
      // Colors come from the theme through the canvas' CSS.
      const fg = getComputedStyle(canvas).color
      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      ctx.fillStyle = fg

      ctx.globalAlpha = 0.3
      for (let y = 0; y < HEIGHT; y += 24) {
        ctx.fillRect(WIDTH / 2 - 1, y, 2, 12)
      }
      ctx.globalAlpha = 1

      ctx.fillRect(PADDLE_MARGIN, s.leftY, PADDLE_W, PADDLE_H)
      ctx.fillRect(WIDTH - PADDLE_MARGIN - PADDLE_W, s.rightY, PADDLE_W, PADDLE_H)
      ctx.fillRect(s.ballX, s.ballY, BALL_SIZE, BALL_SIZE)
    }

    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      // Small fixed sub-steps so a fast ball cannot pass through a paddle.
      let remaining = dt
      while (remaining > 0 && phaseRef.current === "playing") {
        const step = Math.min(remaining, 1 / 240)
        update(step)
        remaining -= step
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
