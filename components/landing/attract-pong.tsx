"use client"

import { useEffect, useRef, useState } from "react"

// "Attract mode" for the landing page: two AIs play Pong in the hero court.
// Hovering (or touching) the court hands the right paddle to the visitor.
// Everything random or time-based runs inside the effect (no hydration risk).

// World is a unit square; sizes are fractions of the court side.
const PADDLE_W = 0.03
const PADDLE_H = 0.26
const BALL_R = 0.055
const BALL_SPEED = 0.55 // court widths per second
const BALL_SPEED_MAX = 1.1
const AI_SPEED = 0.62
const HUMAN_TIMEOUT = 2000 // ms without pointer input before the AI takes over

type Side = "left" | "right"

export function AttractPong({ hint }: { hint: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState({ left: 0, right: 0 })

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!wrap || !canvas || !ctx) return

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches

    const s = {
      ballX: 0.5,
      ballY: 0.5,
      vx: 0,
      vy: 0,
      left: 0.5 - PADDLE_H / 2,
      right: 0.5 - PADDLE_H / 2,
      // Per-paddle aiming error, re-rolled on every hit so the AIs can miss.
      error: { left: 0, right: 0 },
      pauseUntil: 0,
      humanUntil: 0,
      humanY: 0.5,
      score: { left: 0, right: 0 },
    }

    const rollError = (side: Side) => {
      // Mostly accurate, sometimes way off: that's what makes them miss.
      const big = Math.random() < 0.18
      s.error[side] = (Math.random() - 0.5) * (big ? 0.7 : 0.18)
    }

    const serve = (towards: Side, now: number) => {
      const angle = (Math.random() - 0.5) * (Math.PI / 2.5)
      s.ballX = 0.5
      s.ballY = 0.3 + Math.random() * 0.4
      s.vx = Math.cos(angle) * BALL_SPEED * (towards === "left" ? -1 : 1)
      s.vy = Math.sin(angle) * BALL_SPEED
      s.pauseUntil = now + 700
      rollError("left")
      rollError("right")
    }

    // Canvas resolution follows its CSS size and the device pixel ratio.
    let size = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      size = rect.width
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      s.humanY = (e.clientY - rect.top) / rect.height
      s.humanUntil = performance.now() + HUMAN_TIMEOUT
    }
    canvas.addEventListener("pointermove", onPointer)
    canvas.addEventListener("pointerdown", onPointer)

    const movePaddle = (current: number, target: number, dt: number) => {
      const step = AI_SPEED * dt
      const next = current + Math.max(-step, Math.min(step, target - current))
      return Math.max(0, Math.min(1 - PADDLE_H, next))
    }

    const update = (dt: number, now: number) => {
      // AI: track the ball (plus error) when it comes towards you, else recenter.
      const aim = (side: Side) => {
        const coming = side === "left" ? s.vx < 0 : s.vx > 0
        const target = coming ? s.ballY + s.error[side] : 0.5
        return target - PADDLE_H / 2
      }
      s.left = movePaddle(s.left, aim("left"), dt)
      s.right =
        now < s.humanUntil
          ? Math.max(0, Math.min(1 - PADDLE_H, s.humanY - PADDLE_H / 2))
          : movePaddle(s.right, aim("right"), dt)

      if (now < s.pauseUntil) return

      s.ballX += s.vx * dt
      s.ballY += s.vy * dt

      if (s.ballY < BALL_R) {
        s.ballY = BALL_R
        s.vy = Math.abs(s.vy)
      } else if (s.ballY > 1 - BALL_R) {
        s.ballY = 1 - BALL_R
        s.vy = -Math.abs(s.vy)
      }

      const hit = (paddleY: number) =>
        s.ballY > paddleY - BALL_R && s.ballY < paddleY + PADDLE_H + BALL_R

      const bounce = (paddleY: number, dir: 1 | -1, side: Side) => {
        const offset = (s.ballY - (paddleY + PADDLE_H / 2)) / (PADDLE_H / 2)
        const speed = Math.min(Math.hypot(s.vx, s.vy) * 1.06, BALL_SPEED_MAX)
        const angle = offset * (Math.PI / 3.2)
        s.vx = Math.cos(angle) * speed * dir
        s.vy = Math.sin(angle) * speed
        rollError(side === "left" ? "right" : "left")
      }

      if (s.vx < 0 && s.ballX - BALL_R < PADDLE_W && hit(s.left)) {
        s.ballX = PADDLE_W + BALL_R
        bounce(s.left, 1, "left")
      } else if (s.vx > 0 && s.ballX + BALL_R > 1 - PADDLE_W && hit(s.right)) {
        s.ballX = 1 - PADDLE_W - BALL_R
        bounce(s.right, -1, "right")
      }

      if (s.ballX < -BALL_R || s.ballX > 1 + BALL_R) {
        const scorer: Side = s.ballX < 0 ? "right" : "left"
        s.score = { ...s.score, [scorer]: (s.score[scorer] + 1) % 100 }
        setScore(s.score)
        serve(scorer === "left" ? "right" : "left", now)
      }
    }

    const draw = () => {
      // Theme colors, read every frame so the light/dark toggle applies live.
      const style = getComputedStyle(wrap)
      const fg = style.color
      const ball = style.getPropertyValue("--primary").trim() || fg
      const net = style.getPropertyValue("--border").trim() || fg

      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = net
      ctx.fillRect(size / 2 - 0.5, 0, 1, size)

      ctx.fillStyle = fg
      ctx.fillRect(0, s.left * size, PADDLE_W * size, PADDLE_H * size)
      ctx.fillRect(size - PADDLE_W * size, s.right * size, PADDLE_W * size, PADDLE_H * size)

      ctx.fillStyle = ball
      ctx.beginPath()
      ctx.arc(s.ballX * size, s.ballY * size, BALL_R * size, 0, Math.PI * 2)
      ctx.fill()
    }

    serve(Math.random() < 0.5 ? "left" : "right", performance.now())

    if (reduceMotion) {
      // Static frame only.
      s.pauseUntil = Infinity
      draw()
      return () => {
        observer.disconnect()
        canvas.removeEventListener("pointermove", onPointer)
        canvas.removeEventListener("pointerdown", onPointer)
      }
    }

    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      // Hidden by CSS on phones: keep the frame loop idle.
      if (canvas.clientWidth === 0) {
        frame = requestAnimationFrame(loop)
        return
      }
      let remaining = dt
      while (remaining > 0) {
        const step = Math.min(remaining, 1 / 240)
        update(step, now)
        remaining -= step
      }
      draw()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener("pointermove", onPointer)
      canvas.removeEventListener("pointerdown", onPointer)
    }
  }, [])

  return (
    <div ref={wrapRef} className="flex flex-col gap-3 text-foreground">
      <div
        dir="ltr"
        className="flex items-end justify-between text-5xl leading-none font-black tracking-tighter tabular-nums"
        aria-hidden
      >
        <span>{String(score.left).padStart(2, "0")}</span>
        <span>{String(score.right).padStart(2, "0")}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="aspect-square w-full border-y-2 border-foreground"
        aria-hidden
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
