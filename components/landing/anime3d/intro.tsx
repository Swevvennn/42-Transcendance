"use client"

import { useEffect, useRef, useState } from "react"

import { logos } from "@/components/brand/logos"
import { Button } from "@/components/ui/button"

import type { BallOnScreen, Frame, Intro, Theme, Variant } from "./engine"

// Overlay for the 3D anime intros. First visit of the session: the full cut.
// Later loads: only the loading screen, then its logo's red ball floats to
// the middle of the screen and falls into the page's logo (no three.js). The loading screen is real: three.js and
// the scene are loaded and built while the counter runs. Then the WebGL
// canvas plays the cut, a 2D canvas on top adds the anime layer (speed lines,
// cinema bars, flashes, sound effect), and the overlay wipes away, setting
// `data-intro="done"` on the landing to start its kinetic entry.

type Phase = "loading" | "scene" | "leaving" | "done"

const LOADER_MS = 2800
const LEAVE_MS = 600
const MATCH_MS = 1150 // manga: the ball flies into the logo dot
const DROP_MS = 1700 // repeat visits: the loader's ball drops into the page's logo
/** Set once the full cut has been shown in this browser session. */
const SEEN_KEY = "landing-intro-seen"
const SCENE_END = 5.9 // keep in sync with CUT.end in engine.ts
/** Real seconds per scene second: the whole cut plays a little slower. */
const TEMPO = 1.15

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeIn = (t: number) => t ** 3
const easeOut = (t: number) => 1 - (1 - t) ** 3

/** Loader progress: starts slowly and stalls a little, like a real load. */
function progress(t: number) {
  if (t < 0.4) return lerp(0, 0.1, easeIn(t / 0.4))
  if (t < 0.6) return lerp(0.1, 0.42, (t - 0.4) / 0.2)
  if (t < 0.72) return lerp(0.42, 0.48, (t - 0.6) / 0.12)
  if (t < 0.9) return lerp(0.48, 0.88, (t - 0.72) / 0.18)
  return lerp(0.88, 1, easeOut((t - 0.9) / 0.1))
}

type Line = { a: number; b: number; len: number; speed: number; width: number }

export function Anime3DIntro({
  variant,
  name,
  sfx,
  skipLabel,
  loadingLabel,
  once = false,
}: {
  variant: Variant
  name: string
  sfx: string
  skipLabel: string
  loadingLabel: string
  /** Full cut only on the first visit of the session (the home page); the
   * template previews always play it. */
  once?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const glRef = useRef<HTMLCanvasElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const skipRef = useRef<() => void>(() => {})
  const flyRef = useRef<HTMLSpanElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>("loading")

  useEffect(() => {
    const root = rootRef.current
    const gl = glRef.current
    const fx = fxRef.current
    const ctx = fx?.getContext("2d")
    if (!root || !gl || !fx || !ctx) return
    const landing = root.closest("[data-motion]")

    let state: Phase = "loading"
    let cancelled = false
    const go = (next: Phase) => {
      state = next
      if (next === "leaving" || next === "done") landing?.setAttribute("data-intro", "done")
      setPhase(next)
    }

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      go("done")
      return
    }

    const html = document.documentElement
    const previousOverflow = html.style.overflow
    html.style.overflow = "hidden"

    let seen = false
    if (once) {
      try {
        seen = sessionStorage.getItem(SEEN_KEY) === "1"
        sessionStorage.setItem(SEEN_KEY, "1")
      } catch {}
    }

    if (seen) {
      // Repeat visit: loader only. Then the red ball leaves the loader's logo,
      // floats to the middle of the screen and falls into the page's logo.
      const start = performance.now()
      let frame = 0
      let dropped = false
      const finish = () => {
        html.style.overflow = previousOverflow
        landing?.setAttribute("data-ball", "landed")
        go("done")
      }
      const drop = () => {
        if (dropped) return
        dropped = true
        cancelAnimationFrame(frame)
        // The loader's ball (the logo's red dot) is the one that flies.
        const dot = logoRef.current?.querySelector<HTMLElement>(".rounded-full")
        const from = dot?.getBoundingClientRect()
        const target = landing?.querySelector(".lp-block-ball")?.getBoundingClientRect()
        const fly = flyRef.current
        go("leaving")
        if (!dot || !from || !fly || !target || target.width === 0) {
          window.setTimeout(finish, LEAVE_MS)
          return
        }
        dot.style.visibility = "hidden"
        Object.assign(fly.style, {
          display: "block",
          left: `${target.left}px`,
          top: `${target.top}px`,
          width: `${target.width}px`,
          height: `${target.height}px`,
        })
        // Offsets from the target, center to center (transform origin is the
        // center of the ball).
        const cx = target.left + target.width / 2
        const cy = target.top + target.height / 2
        const startX = from.left + from.width / 2 - cx
        const startY = from.top + from.height / 2 - cy
        const midX = width / 2 - cx
        const midY = height / 2 - cy
        const s0 = from.width / target.width
        fly.animate(
          [
            // Out of the logo to the middle of the screen, growing.
            { transform: `translate(${startX}px, ${startY}px) scale(${s0})`, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
            { transform: `translate(${midX}px, ${midY}px) scale(1.5)`, offset: 0.34, easing: "ease-in-out" },
            // Hangs there a beat, rising a little before the drop.
            { transform: `translate(${midX}px, ${midY - 14}px) scale(1.5)`, offset: 0.5, easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
            // Falls with gravity into the page's logo: squash, bounce, settle.
            { transform: "translate(0, 0) scale(1.35, 0.7)", offset: 0.82, easing: "cubic-bezier(0, 0.55, 0.45, 1)" },
            { transform: "translate(0, -18%) scale(0.95, 1.05)", offset: 0.92, easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
            { transform: "translate(0, 0) scale(1)" },
          ],
          { duration: DROP_MS, fill: "forwards" },
        ).onfinish = finish
      }
      const loop = (now: number) => {
        const p = progress(clamp((now - start) / LOADER_MS))
        if (counterRef.current) counterRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0")
        if (barRef.current) barRef.current.style.scale = `${p} 1`
        if (p >= 1) drop()
        else frame = requestAnimationFrame(loop)
      }
      frame = requestAnimationFrame(loop)
      skipRef.current = drop
      return () => {
        cancelAnimationFrame(frame)
        html.style.overflow = previousOverflow
      }
    }

    // The cut always plays in the light theme's colors: a `.light` probe reads
    // them even in dark mode. In dark mode the canvases are only dimmed (CSS
    // filter in app/landing-motion.css), so it looks the same, less bright.
    const probe = document.createElement("div")
    probe.className = "light"
    probe.hidden = true
    root.append(probe)
    const light = getComputedStyle(probe)
    const css = (name: string, fallback: string) => light.getPropertyValue(name).trim() || fallback
    const theme: Theme = {
      ink: css("--foreground", "#111"),
      paper: css("--background", "#fff"),
      accent: css("--primary", "#e11"),
      line: css("--muted", "#ddd"),
    }
    const border = css("--border", theme.ink)
    probe.remove()
    // Flashes are a burst of paper, the cinema bars are ink.
    const flashColor = theme.paper
    const barColor = theme.ink
    const font = getComputedStyle(root).fontFamily

    // Load three.js and build the scene while the loader runs.
    let intro: Intro | null = null
    let failed = false
    import("./engine")
      .then(({ createIntro }) => document.fonts.ready.then(() => createIntro))
      .then((createIntro) => {
        if (cancelled) return
        intro = createIntro(gl, variant, theme)
        resize()
      })
      .catch(() => {
        // No WebGL: skip straight to the page.
        failed = true
      })

    let width = 0
    let height = 0
    let dpr = 1
    const resize = () => {
      dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      fx.width = Math.round(width * dpr)
      fx.height = Math.round(height * dpr)
      intro?.resize(width, height, dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    const random = (n: number): Line[] =>
      Array.from({ length: n }, () => ({
        a: Math.random(),
        b: Math.random(),
        len: 0.1 + Math.random() * 0.35,
        speed: 0.6 + Math.random() * 1.4,
        width: 1 + Math.random() * 3,
      }))
    const speedLines = random(34)
    let focusLines = random(80)
    let focusAt = 0

    /** The 2D anime layer drawn over the 3D render. */
    const drawFx = (scene: number, frame: Frame, now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      const ink = frame.invert ? theme.paper : theme.ink

      if (frame.lines !== "none") {
        ctx.fillStyle = border
        for (const l of speedLines) {
          const run = (l.b + scene * l.speed * 0.9) % 1
          if (frame.lines === "vertical") {
            ctx.fillRect(l.a * width, (run * 1.4 - 0.2) * height, l.width, l.len * height)
          } else {
            ctx.fillRect((1.2 - run * 1.4) * width, l.a * height, l.len * width, l.width)
          }
        }
      }

      if (frame.impact) {
        // Focus lines rushing to the center, redrawn every few frames.
        if (now - focusAt > 60) {
          focusLines = random(80)
          focusAt = now
        }
        const cx = width / 2
        const cy = height / 2
        const far = Math.hypot(width, height)
        ctx.fillStyle = ink
        for (const l of focusLines) {
          const a = l.a * Math.PI * 2
          const inner = Math.min(width, height) * (0.28 + l.b * 0.15)
          const spread = 0.003 + l.width * 0.003
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
          ctx.lineTo(cx + Math.cos(a - spread) * far, cy + Math.sin(a - spread) * far)
          ctx.lineTo(cx + Math.cos(a + spread) * far, cy + Math.sin(a + spread) * far)
          ctx.fill()
        }
        // Sound effect lettering, punched in.
        const local = scene - 3.3
        const size = Math.min(width, height * 1.6) * 0.15
        const punch = lerp(1.8, 1, easeOut(clamp(local / 0.14)))
        ctx.save()
        ctx.translate(width * 0.66, height * 0.27)
        ctx.rotate(-0.12)
        ctx.scale(punch, punch)
        ctx.font = `900 ${size}px ${font}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = theme.accent
        ctx.fillText(sfx, size * 0.05, size * 0.05)
        ctx.fillStyle = ink
        ctx.fillText(sfx, 0, 0)
        ctx.restore()
      }

      if (frame.flash) {
        ctx.fillStyle = flashColor
        ctx.fillRect(0, 0, width, height)
      }

      const bar = frame.bars ? easeOut(clamp(scene / 0.5)) * height * 0.08 : 0
      if (bar > 0) {
        ctx.fillStyle = barColor
        ctx.fillRect(0, 0, width, bar)
        ctx.fillRect(0, height - bar, width, bar)
      }
    }

    // Manga ending: a match cut. The ball that fills the screen flies into the
    // red dot of the Swiss block logo while the overlay fades out.
    const matchCut = variant === "manga"
    let lastBall: BallOnScreen | null = null
    const flyToLogo = () => {
      const fly = flyRef.current
      const target = landing?.querySelector(".lp-block-ball")?.getBoundingClientRect()
      if (!fly || !target || target.width === 0) return
      const from = lastBall?.visible
        ? lastBall
        : { x: width / 2, y: -target.height, r: target.width / 2, visible: true }
      Object.assign(fly.style, {
        display: "block",
        left: `${target.left}px`,
        top: `${target.top}px`,
        width: `${target.width}px`,
        height: `${target.height}px`,
      })
      const dx = from.x - (target.left + target.width / 2)
      const dy = from.y - (target.top + target.height / 2)
      const s0 = Math.max(0.2, (from.r * 2) / target.width)
      fly.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${s0})`, easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
          { transform: "translate(0, 0) scale(1.35, 0.7)", offset: 0.72, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
          { transform: "translate(0, -18%) scale(0.95, 1.05)", offset: 0.86 },
          { transform: "translate(0, 0) scale(1)" },
        ],
        { duration: MATCH_MS, fill: "forwards" },
      )
    }
    const leave = (now: number) => {
      leaveStart = now
      go("leaving")
      if (matchCut) flyToLogo()
    }

    const start = performance.now()
    let sceneStart = 0
    let leaveStart = 0
    let frame = 0
    const loop = (now: number) => {
      if (state === "loading") {
        let p = progress(clamp((now - start) / LOADER_MS))
        if (!intro && !failed) p = Math.min(p, 0.9)
        if (counterRef.current) counterRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0")
        if (barRef.current) barRef.current.style.scale = `${p} 1`
        if (failed && now - start > LOADER_MS) {
          leave(now)
        } else if (p >= 1) {
          sceneStart = now
          go("scene")
        }
      }
      if ((state === "scene" || state === "leaving") && intro) {
        const scene = Math.min((now - sceneStart) / 1000 / TEMPO, SCENE_END)
        const out = intro.render(scene)
        lastBall = out.ball
        drawFx(scene, out.frame, now)
        if (state === "scene" && scene >= SCENE_END) leave(now)
      }
      if (state === "leaving" && now - leaveStart >= (matchCut ? MATCH_MS : LEAVE_MS)) {
        html.style.overflow = previousOverflow
        landing?.setAttribute("data-ball", "landed")
        go("done")
        return
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    skipRef.current = () => {
      if (state === "done" || state === "leaving") return
      const now = performance.now()
      if (state === "loading") sceneStart = now - SCENE_END * 1000 * TEMPO
      leave(now)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      html.style.overflow = previousOverflow
      intro?.dispose()
    }
  }, [variant, sfx, once])

  if (phase === "done") return null

  const Logo = logos.stack.Full

  return (
    <>
    <div
      ref={rootRef}
      className="lp-intro fixed inset-0 z-[100] bg-background text-foreground"
      data-phase={phase}
      data-exit={variant === "manga" ? "fade" : undefined}
    >
      <canvas ref={glRef} className="lp-intro-canvas absolute inset-0 size-full" aria-hidden />
      <canvas ref={fxRef} className="lp-intro-canvas absolute inset-0 size-full" aria-hidden />
      <div className="lp-intro-loader absolute inset-0 flex flex-col items-center justify-center gap-8 px-4">
        <div ref={logoRef} className="lp-intro-logo">
          <Logo name={name} size={112} />
        </div>
        <div className="flex w-56 flex-col gap-2 text-xs font-semibold tracking-widest uppercase">
          <div className="flex justify-between">
            <span>{loadingLabel}</span>
            <span ref={counterRef} className="tabular-nums">
              000
            </span>
          </div>
          <span className="block h-0.5 bg-border">
            <span ref={barRef} className="block h-full origin-left scale-x-0 bg-primary" />
          </span>
        </div>
      </div>
      {/* Skip only while the cut plays, never on the loading screen. */}
      {phase === "scene" && (
      <Button
        variant="outline"
        className="absolute right-4 bottom-[calc(8vh+1rem)] z-10 text-xs font-semibold tracking-widest uppercase"
        onClick={() => skipRef.current()}
      >
        {skipLabel}
      </Button>
      )}
    </div>
    <span ref={flyRef} className="pointer-events-none fixed z-[101] hidden rounded-full bg-primary" aria-hidden />
    </>
  )
}
