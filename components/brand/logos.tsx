import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

// Logo explorations for Pongo (previewed in /templates). Every mark is drawn
// with theme tokens (foreground + the red primary), so it follows light/dark.
// `size` is in px: the font size for wordmarks, the side for square icons.

export const logoDesigns = ["ballO", "point", "paddle", "court", "stack"] as const
export type LogoDesign = (typeof logoDesigns)[number]

type LogoProps = { name: string; size: number; className?: string }

const fontSize = (size: number) => ({ fontSize: size }) as CSSProperties

const wordmark = "inline-block leading-none font-black tracking-tighter whitespace-nowrap"

/** The brand name with a red ball sitting in the counter of its first "o". */
export function BallOText({ name, ball = true }: { name: string; ball?: boolean }) {
  const at = name.toLowerCase().indexOf("o")
  if (at < 0) return name
  return (
    <>
      {name.slice(0, at)}
      <span className="brand-o">
        {name[at]}
        {ball && <span className="brand-o-ball" />}
      </span>
      {name.slice(at + 1)}
    </>
  )
}

// 01: the red ball lands in the first "o" (matches the anime intro).
function BallOFull({ name, size, className }: LogoProps) {
  return (
    <span className={cn(wordmark, className)} style={fontSize(size)} role="img" aria-label={name}>
      <span aria-hidden>
        <BallOText name={name} />
      </span>
    </span>
  )
}

function BallOIcon({ name, size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label={name}>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="6.5" />
      <circle cx="16" cy="16" r="4" className="fill-primary" />
    </svg>
  )
}

// 02: the current header mark, the name and a red full stop.
function PointFull({ name, size, className }: LogoProps) {
  return (
    <span className={cn(wordmark, className)} style={fontSize(size)} role="img" aria-label={name}>
      <span aria-hidden>
        {name}
        <span className="text-primary">.</span>
      </span>
    </span>
  )
}

function PointIcon({ name, size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label={name}>
      <rect width="32" height="32" fill="currentColor" />
      {/* "P" drawn as shapes so it renders the same at 16 px. */}
      <path
        d="M7 6h9.5a6.5 6.5 0 0 1 0 13H12.5v7H7Zm5.5 4.6v3.8h3.6a1.9 1.9 0 0 0 0-3.8Z"
        className="fill-background"
        fillRule="evenodd"
      />
      <circle cx="23.5" cy="23" r="3" className="fill-primary" />
    </svg>
  )
}

// 03: the "P" is a paddle (the stem) and the ball (the bowl).
function PaddleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 36" className={className} aria-hidden>
      <rect width="10" height="36" fill="currentColor" />
      <circle cx="18" cy="10" r="10" className="fill-primary" />
    </svg>
  )
}

function PaddleFull({ name, size, className }: LogoProps) {
  return (
    <span className={cn(wordmark, className)} style={fontSize(size)} role="img" aria-label={name}>
      <span aria-hidden>
        <PaddleMark className="mr-[0.06em] inline-block h-[0.72em] w-auto align-baseline" />
        {name.slice(1).toLowerCase()}
      </span>
    </span>
  )
}

function PaddleIcon({ name, size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label={name}>
      <rect x="6" y="4" width="8" height="24" fill="currentColor" />
      <circle cx="19" cy="11" r="7" className="fill-primary" />
    </svg>
  )
}

// 04: a tiny court, two paddles and the ball, next to a lowercase name.
function CourtIcon({ name, size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label={name}>
      <rect x="2" y="4" width="5" height="14" fill="currentColor" />
      <rect x="25" y="14" width="5" height="14" fill="currentColor" />
      <rect x="15.5" y="2" width="1" height="28" fill="currentColor" opacity="0.25" />
      <circle cx="16" cy="12" r="4.5" className="fill-primary" />
    </svg>
  )
}

function CourtFull({ name, size, className }: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-[0.25em] leading-none", className)}
      style={fontSize(size)}
      role="img"
      aria-label={name}
    >
      <CourtIcon name={name} size={size} className="size-[0.85em]" />
      <span className="font-bold tracking-tight" aria-hidden>
        {name.toLowerCase()}
      </span>
    </span>
  )
}

// 05: Swiss block, the name split on two lines with the ball in the grid.
function StackFull({ name, size, className }: LogoProps) {
  const half = Math.ceil(name.length / 2)
  return (
    <span
      className={cn(
        "relative inline-flex flex-col justify-end bg-foreground p-[0.09em] text-background uppercase",
        className,
      )}
      style={{ fontSize: size * 0.36, width: size, height: size }}
      role="img"
      aria-label={name}
    >
      <span className="leading-[0.82] font-black tracking-tighter" aria-hidden>
        {name.slice(0, half)}
        <br />
        {name.slice(half)}
      </span>
      <span className="absolute top-[0.25em] right-[0.25em] size-[0.45em] rounded-full bg-primary" aria-hidden />
    </span>
  )
}

function StackIcon({ name, size, className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label={name}>
      <rect width="32" height="32" fill="currentColor" />
      <rect x="4" y="15" width="16" height="5" className="fill-background" />
      <rect x="4" y="23" width="11" height="5" className="fill-background" />
      <circle cx="24" cy="8" r="4.5" className="fill-primary" />
    </svg>
  )
}

export const logos: Record<
  LogoDesign,
  { Full: (props: LogoProps) => ReactNode; Icon: (props: LogoProps) => ReactNode }
> = {
  ballO: { Full: BallOFull, Icon: BallOIcon },
  point: { Full: PointFull, Icon: PointIcon },
  paddle: { Full: PaddleFull, Icon: PaddleIcon },
  court: { Full: CourtFull, Icon: CourtIcon },
  stack: { Full: StackFull, Icon: StackIcon },
}
