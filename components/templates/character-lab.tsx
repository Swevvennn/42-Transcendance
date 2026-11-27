"use client"

import { useEffect, useRef, useState } from "react"

import type { Lab, LabPose, LabView } from "@/components/landing/anime3d/lab"
import type { CharacterStyle } from "@/components/landing/anime3d/rig"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Character lab: every model style on its own 3D turntable (drag to turn),
// with shared controls for the pose and the manga screentone.

const poses: LabPose[] = ["ready", "swing", "smash"]
const views: LabView[] = ["body", "face"]

type Labels = {
  pose: string
  poses: Record<LabPose, string>
  view: string
  views: Record<LabView, string>
  screentone: string
  hint: string
  hero: string
  rival: string
}

export function CharacterLab({
  styles,
  labels,
}: {
  styles: { id: CharacterStyle; name: string; description: string }[]
  labels: Labels
}) {
  const canvases = useRef<(HTMLCanvasElement | null)[]>([])
  const [pose, setPose] = useState<LabPose>("swing")
  const [view, setView] = useState<LabView>("body")
  const [manga, setManga] = useState(true)
  const options = useRef({ pose, view, manga })
  // Rebuilt with the new colors when the theme is toggled.
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => {
    const html = document.documentElement
    const sync = () => setDark(html.classList.contains("dark"))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    options.current = { pose, view, manga }
  }, [pose, view, manga])

  useEffect(() => {
    if (dark === null) return
    let cancelled = false
    let frame = 0
    const labs: { lab: Lab; canvas: HTMLCanvasElement; spin: number; drag: number | null }[] = []
    const cleanups: (() => void)[] = []
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches

    import("@/components/landing/anime3d/lab").then(({ createLab }) => {
      if (cancelled) return
      const style = getComputedStyle(document.documentElement)
      const css = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
      const theme = {
        ink: css("--foreground", "#111"),
        paper: css("--background", "#fff"),
        accent: css("--primary", "#e11"),
        line: css("--muted", "#ddd"),
      }
      styles.forEach(({ id }, i) => {
        const canvas = canvases.current[i]
        if (!canvas) return
        const entry = { lab: createLab(canvas, id, theme), canvas, spin: 0, drag: null as number | null }
        labs.push(entry)
        const resize = () => {
          const rect = canvas.getBoundingClientRect()
          entry.lab.resize(rect.width, rect.height, window.devicePixelRatio || 1)
        }
        const observer = new ResizeObserver(resize)
        observer.observe(canvas)
        resize()
        // Drag to turn the models.
        const down = (e: PointerEvent) => {
          entry.drag = e.clientX
          canvas.setPointerCapture(e.pointerId)
        }
        const move = (e: PointerEvent) => {
          if (entry.drag === null) return
          entry.spin += (e.clientX - entry.drag) * 0.01
          entry.drag = e.clientX
        }
        const up = () => (entry.drag = null)
        canvas.addEventListener("pointerdown", down)
        canvas.addEventListener("pointermove", move)
        canvas.addEventListener("pointerup", up)
        canvas.addEventListener("pointercancel", up)
        cleanups.push(() => {
          observer.disconnect()
          canvas.removeEventListener("pointerdown", down)
          canvas.removeEventListener("pointermove", move)
          canvas.removeEventListener("pointerup", up)
          canvas.removeEventListener("pointercancel", up)
          entry.lab.dispose()
        })
      })

      const start = performance.now()
      const loop = (now: number) => {
        const t = reduceMotion ? 0 : (now - start) / 1000
        for (const entry of labs) {
          // A gentle sway that keeps the faces towards you, plus the drag.
          const sway = reduceMotion ? 0 : Math.sin(t * 0.6) * 0.6
          entry.lab.render(t, { ...options.current, spin: entry.spin + sway })
        }
        frame = requestAnimationFrame(loop)
      }
      frame = requestAnimationFrame(loop)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      for (const cleanup of cleanups) cleanup()
    }
  }, [styles, dark])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{labels.pose}</span>
          {poses.map((p) => (
            <Button
              key={p}
              variant={pose === p ? "default" : "outline"}
              className="h-8 px-3"
              aria-pressed={pose === p}
              onClick={() => setPose(p)}
            >
              {labels.poses[p]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{labels.view}</span>
          {views.map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "outline"}
              className="h-8 px-3"
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {labels.views[v]}
            </Button>
          ))}
        </div>
        <Button
          variant={manga ? "default" : "outline"}
          className="h-8 px-3"
          aria-pressed={manga}
          onClick={() => setManga((m) => !m)}
        >
          {labels.screentone}
        </Button>
        <span className="text-muted-foreground">{labels.hint}</span>
      </div>
      <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {styles.map(({ id, name, description }, i) => (
          <li key={id} className="flex flex-col gap-3 border-t-2 border-foreground pt-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl font-bold tracking-tight">
                <span className="mr-2 text-primary">0{i + 1}</span>
                {name}
              </h3>
              <span className="text-xs text-muted-foreground">
                {labels.hero} · {labels.rival}
              </span>
            </div>
            <canvas
              ref={(el) => {
                canvases.current[i] = el
              }}
              className={cn("aspect-[4/3] w-full cursor-grab touch-none border border-border active:cursor-grabbing")}
              aria-label={name}
              role="img"
            />
            <p className="text-sm text-muted-foreground">{description}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
