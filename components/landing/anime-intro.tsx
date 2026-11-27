"use client"

import { useEffect, useRef, useState } from "react"

import { logos } from "@/components/brand/logos"
import { Button } from "@/components/ui/button"

// Intro for the "anime" landing variant:
// 1. a loading screen (DOM, rendered on the server so it shows at once);
// 2. a canvas "anime cut" in the theme colors, edited as a shot list:
//    establishing push-in → tracking rally → eye close-up (slow motion) →
//    low-angle jump → impact frame (freeze) → slam and whip pan up → wide;
// 3. the overlay wipes away and sets `data-intro="done"` on the landing, which
//    starts the kinetic CSS entry (the ball drops into the first "o").
// All timing and randomness live in the effect: the server HTML is static.

type Phase = "loading" | "scene" | "leaving" | "done"
type Side = "L" | "R"
type Vec = { x: number; y: number }
type Hit = { side: Side; t: number; kind: "drive" | "lob" | "smash" | "whiff" }

const LOADER_MS = 2800
const LEAVE_MS = 600

// Stage: 1600 units wide; the floor is at y = 780.
const STAGE_W = 1600
const FLOOR = 780
const TABLE_Y = 560
const TABLE_L = 420
const TABLE_R = 1180
const NET_X = 800
const BALL_R = 12
const PLAYER_X = 250 // left player; the right one is mirrored

// ── Edit: shot list (scene seconds) ─────────────────────────────

const CUT = {
  track: 1.4, // camera follows the ball
  eye: 2.6, // extreme close-up on the hero's eye
  jump: 3.1, // low angle, the hero jumps for the smash
  impact: 3.5, // impact frame, time frozen
  slam: 4.35, // ball slams the table, whip pan up
  wide: 5.05, // wide shot, both players look up
  end: 5.6,
}
const SCENE_END = CUT.end

// Scene time → world time: slow motion around the smash, freeze on impact.
const SPEED: [number, number][] = [
  [0, 1],
  [CUT.eye, 0.3],
  [CUT.jump, 0.35],
  [CUT.impact, 0],
  [CUT.slam, 1],
]

function worldAt(scene: number) {
  let world = 0
  for (let i = 0; i < SPEED.length; i++) {
    const [s0, rate] = SPEED[i]
    const s1 = SPEED[i + 1]?.[0] ?? Infinity
    if (scene <= s0) break
    world += (Math.min(scene, s1) - s0) * rate
  }
  return world
}

const SMASH_T = worldAt(CUT.impact)
const SLAM_T = SMASH_T + 0.15

const HITS: Hit[] = [
  { side: "R", t: -0.45, kind: "drive" },
  { side: "L", t: 0.3, kind: "drive" },
  { side: "R", t: 0.95, kind: "drive" },
  { side: "L", t: 1.55, kind: "drive" },
  { side: "R", t: 2.1, kind: "lob" },
  { side: "L", t: SMASH_T, kind: "smash" },
  { side: "R", t: SLAM_T + 0.05, kind: "whiff" },
]

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
const scale = (v: Vec, k: number): Vec => ({ x: v.x * k, y: v.y * k })
const polar = (angle: number, r: number): Vec => ({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
const rotate = (v: Vec, a: number): Vec => ({
  x: v.x * Math.cos(a) - v.y * Math.sin(a),
  y: v.x * Math.sin(a) + v.y * Math.cos(a),
})

/** Interpolates keyframes [time, value] with an easing per segment. */
function keyed(t: number, keys: [number, number, ((t: number) => number)?][]) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, ease = easeInOut] = keys[i]
    const [t0, v0] = keys[i - 1]
    if (t <= t1) return lerp(v0, v1, ease((t - t0) / (t1 - t0)))
  }
  return keys[keys.length - 1][1]
}

// ── Players ──────────────────────────────────────────────────────

/** Paddle arm angle (radians, 0 = towards the table, negative = up). */
function armAngle(side: Side, t: number) {
  const REST = 0.9
  for (const hit of HITS) {
    if (hit.side !== side) continue
    const d = t - hit.t
    if (d < -0.5 || d > 0.6) continue
    if (hit.kind === "smash") {
      return keyed(d, [
        [-0.5, REST],
        [-0.12, -2.4, easeOut],
        [0, -0.7, easeIn],
        [0.25, 1.2, easeOut],
        [0.6, 1.2],
      ])
    }
    if (hit.kind === "whiff") {
      return keyed(d, [
        [-0.3, REST],
        [-0.1, 2.3, easeOut],
        [0.05, -0.6, easeIn],
        [0.3, -1.2, easeOut],
        [0.6, -1.2],
      ])
    }
    const lob = hit.kind === "lob"
    return keyed(d, [
      [-0.34, REST],
      [-0.12, 2.5, easeOut],
      [0, lob ? 0.25 : -0.15, easeIn],
      [0.16, lob ? -0.6 : -1.3, easeOut],
      [0.48, REST],
    ])
  }
  return REST
}

type Pose = { hipX: number; hipY: number; lean: number; arm: number; lift: number; look: number; t: number }

function pose(side: Side, t: number): Pose {
  const bob = Math.sin(t * 9 + (side === "L" ? 0 : 1.7)) * 4
  // After the slam both players lean back and look up at the ball.
  const look = easeOut(clamp((t - SLAM_T - 0.05) / 0.35))
  // The hero jumps for the smash.
  const d = t - SMASH_T
  const lift = side === "L" ? Math.max(0, 1 - ((d + 0.03) / 0.37) ** 2) * 150 : 0
  const whip = side === "L" ? clamp(1 - Math.abs(d) / 0.25) : 0
  return {
    hipX: PLAYER_X + whip * 20,
    hipY: 640 + bob - lift,
    lean: lerp(0.32, -0.22, look) + whip * 0.2,
    arm: armAngle(side, t),
    lift,
    look,
    t,
  }
}

/** Two-bone IK: knee or elbow position, bending towards +x. */
function joint(a: Vec, b: Vec, l1: number, l2: number): Vec {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01)
  const base = Math.atan2(dy, dx)
  const bend = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1))
  return add(a, polar(base - bend, l1))
}

/** Joint positions in the player's own frame (facing +x). */
function skeleton(p: Pose) {
  const hip = { x: p.hipX, y: p.hipY }
  const up = { x: Math.sin(p.lean), y: -Math.cos(p.lean) }
  const fwd = { x: Math.cos(p.lean), y: Math.sin(p.lean) }
  const shoulder = add(hip, scale(up, 125))
  const neck = add(shoulder, scale(up, 18))
  const headAngle = p.lean * 0.4 - p.look * 0.75
  const head = add(neck, rotate(scale(up, 30), -p.look * 0.5))
  const elbow = add(shoulder, polar(p.arm, 58))
  const fore = p.arm - 0.4
  const hand = add(elbow, polar(fore, 50))
  const paddle = add(hand, polar(fore, 34))
  const freeArm = 2.2 - (p.arm - 0.9) * 0.35
  const freeElbow = add(shoulder, polar(freeArm, 52))
  const freeHand = add(freeElbow, polar(freeArm - 0.9, 44))
  // Feet on the floor, tucked under the body while jumping.
  const tuck = clamp(p.lift / 60)
  const footF = {
    x: lerp(p.hipX + 78, p.hipX + 40, tuck),
    y: lerp(FLOOR, p.hipY + 118, tuck),
  }
  const footB = {
    x: lerp(p.hipX - 72, p.hipX - 60, tuck),
    y: lerp(FLOOR, p.hipY + 96, tuck),
  }
  const kneeF = joint(hip, footF, 84, 84)
  const kneeB = joint(hip, footB, 84, 84)
  return { hip, up, fwd, shoulder, neck, head, headAngle, elbow, hand, paddle, freeElbow, freeHand, footF, footB, kneeF, kneeB }
}

const toWorld = (side: Side, v: Vec): Vec => (side === "L" ? v : { x: STAGE_W - v.x, y: v.y })

const paddleAt = (side: Side, t: number) => toWorld(side, skeleton(pose(side, t)).paddle)

// ── Ball ─────────────────────────────────────────────────────────

type Segment = { t0: number; t1: number; from: Vec; to: Vec; arc: number }

function buildBallPath(): Segment[] {
  const segments: Segment[] = []
  const strokes = HITS.filter((h) => h.kind !== "whiff")
  for (let i = 0; i < strokes.length - 1; i++) {
    const a = strokes[i]
    const b = strokes[i + 1]
    const from = paddleAt(a.side, a.t)
    const to = paddleAt(b.side, b.t)
    const lob = a.kind === "lob"
    const tb = lerp(a.t, b.t, lob ? 0.35 : 0.6)
    const bounce = { x: b.side === "R" ? NET_X + 230 : NET_X - 230, y: TABLE_Y - BALL_R }
    segments.push({ t0: a.t, t1: tb, from, to: bounce, arc: lob ? 120 : 60 })
    segments.push({ t0: tb, t1: b.t, from: bounce, to, arc: lob ? 380 : 50 })
  }
  // Smash: straight down onto the far side of the table, then up and away.
  const smash = paddleAt("L", SMASH_T)
  const slam = { x: TABLE_R - 110, y: TABLE_Y - BALL_R }
  segments.push({ t0: SMASH_T, t1: SLAM_T, from: smash, to: slam, arc: 0 })
  segments.push({ t0: SLAM_T, t1: SLAM_T + 0.45, from: slam, to: { x: slam.x + 160, y: -1400 }, arc: 0 })
  return segments
}

function ballAt(path: Segment[], t: number): Vec {
  const seg = path.find((s) => t <= s.t1) ?? path[path.length - 1]
  const s = clamp((t - seg.t0) / (seg.t1 - seg.t0))
  return {
    x: lerp(seg.from.x, seg.to.x, s),
    y: lerp(seg.from.y, seg.to.y, s) - seg.arc * 4 * s * (1 - s),
  }
}

// ── Drawing helpers ──────────────────────────────────────────────

type Colors = { bg: string; fg: string; ball: string; line: string; font: string }

/** Tapered limb: two circles joined by their tangents. */
function capsule(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, ra: number, rb: number) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x)
  ctx.beginPath()
  ctx.arc(a.x, a.y, ra, angle + Math.PI / 2, angle - Math.PI / 2)
  ctx.arc(b.x, b.y, rb, angle - Math.PI / 2, angle + Math.PI / 2)
  ctx.closePath()
  ctx.fill()
}

function line(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, width: number) {
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

const along = (a: Vec, b: Vec, k: number): Vec => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) })

/** Leg with shorts, sock line and a sneaker; `paper` draws the cel lines. */
function leg(ctx: CanvasRenderingContext2D, hip: Vec, knee: Vec, foot: Vec, ink: string, paper: string) {
  ctx.fillStyle = ink
  capsule(ctx, hip, knee, 16, 11)
  capsule(ctx, knee, foot, 11, 7)
  // Sneaker.
  ctx.beginPath()
  ctx.moveTo(foot.x - 12, foot.y - 12)
  ctx.lineTo(foot.x + 30, foot.y - 6)
  ctx.quadraticCurveTo(foot.x + 36, foot.y + 2, foot.x + 28, foot.y + 4)
  ctx.lineTo(foot.x - 14, foot.y + 4)
  ctx.closePath()
  ctx.fill()
  // Shorts: wider over the top of the thigh.
  capsule(ctx, hip, along(hip, knee, 0.55), 24, 20)
  ctx.strokeStyle = paper
  ctx.lineCap = "round"
  const hemA = along(hip, knee, 0.55)
  const n = rotate({ x: knee.x - hip.x, y: knee.y - hip.y }, Math.PI / 2)
  const len = Math.hypot(n.x, n.y) || 1
  const off = scale(n, 17 / len)
  line(ctx, add(hemA, off), add(hemA, scale(off, -1)), 2.5)
  line(ctx, { x: foot.x - 8, y: foot.y - 14 }, { x: foot.x + 6, y: foot.y - 12 }, 2.5)
  line(ctx, { x: foot.x - 12, y: foot.y }, { x: foot.x + 28, y: foot.y }, 2)
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  side: Side,
  t: number,
  c: { ink: string; paper: string; accent: string },
  frozen: boolean,
) {
  const p = pose(side, t)
  const k = skeleton(p)
  const { ink, paper, accent } = c
  ctx.save()
  if (side === "R") {
    ctx.translate(STAGE_W, 0)
    ctx.scale(-1, 1)
  }
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  // Back leg and free arm, behind the body.
  leg(ctx, k.hip, k.kneeB, k.footB, ink, paper)
  ctx.fillStyle = ink
  capsule(ctx, k.shoulder, k.freeElbow, 11, 8)
  capsule(ctx, k.freeElbow, k.freeHand, 8, 7)

  // Torso: athletic V shape, shirt hem and a rim light on the back.
  const { hip, shoulder, up, fwd } = k
  const at = (base: Vec, f: number, u: number) => add(base, add(scale(fwd, f), scale(up, u)))
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.moveTo(at(hip, -20, -6).x, at(hip, -20, -6).y)
  ctx.lineTo(at(hip, 19, -6).x, at(hip, 19, -6).y)
  const belly = at(hip, 30, 60)
  const chest = at(shoulder, 27, -16)
  ctx.quadraticCurveTo(belly.x, belly.y, chest.x, chest.y)
  const top = at(shoulder, 0, 10)
  const chestTop = at(shoulder, 22, 8)
  ctx.quadraticCurveTo(chestTop.x, chestTop.y, top.x, top.y)
  const back = at(shoulder, -26, -12)
  const backTop = at(shoulder, -26, 6)
  ctx.quadraticCurveTo(backTop.x, backTop.y, back.x, back.y)
  const lower = at(hip, -30, 60)
  const hipBack = at(hip, -20, -6)
  ctx.quadraticCurveTo(lower.x, lower.y, hipBack.x, hipBack.y)
  ctx.fill()
  capsule(ctx, at(shoulder, 0, 4), k.neck, 9, 8)
  ctx.strokeStyle = paper
  line(ctx, at(hip, -21, 14), at(hip, 22, 14), 2.5)
  ctx.beginPath()
  const rimA = at(shoulder, -20, -16)
  const rimC = at(hip, -27, 55)
  const rimB = at(hip, -15, 22)
  ctx.moveTo(rimA.x, rimA.y)
  ctx.quadraticCurveTo(rimC.x, rimC.y, rimB.x, rimB.y)
  ctx.lineWidth = 2
  ctx.stroke()

  // Front leg, outlined so it reads over the back leg.
  ctx.fillStyle = paper
  capsule(ctx, k.kneeF, k.footF, 14, 10)
  leg(ctx, k.hip, k.kneeF, k.footF, ink, paper)

  drawHead(ctx, side, k.head, k.headAngle, p.t, ink, paper, accent)

  // Paddle arm last, with a paper outline (classic cel separation).
  const arm = () => {
    capsule(ctx, k.shoulder, k.elbow, 12, 9)
    capsule(ctx, k.elbow, k.hand, 9, 7)
    capsule(ctx, k.hand, k.paddle, 4, 4)
    ctx.beginPath()
    ctx.ellipse(k.paddle.x, k.paddle.y, 23, 20, p.arm - 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = paper
  capsule(ctx, k.shoulder, k.elbow, 16, 13)
  capsule(ctx, k.elbow, k.hand, 13, 11)
  ctx.beginPath()
  ctx.ellipse(k.paddle.x, k.paddle.y, 27, 24, p.arm - 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = ink
  arm()
  // Short sleeve hem.
  ctx.strokeStyle = paper
  const sleeve = along(k.shoulder, k.elbow, 0.5)
  const sn = rotate(polar(p.arm, 1), Math.PI / 2)
  line(ctx, add(sleeve, scale(sn, 13)), add(sleeve, scale(sn, -13)), 2.5)

  // Swing smear: fading copies of the paddle while the arm moves fast.
  const speed = Math.abs(armAngle(side, t) - armAngle(side, t - 0.03))
  if (speed > 0.12 && !frozen) {
    ctx.fillStyle = ink
    for (let i = 1; i <= 5; i++) {
      const ghost = skeleton({ ...p, arm: armAngle(side, t - i * 0.016) })
      ctx.globalAlpha = 0.3 - i * 0.05
      ctx.beginPath()
      ctx.ellipse(ghost.paddle.x, ghost.paddle.y, 23, 20, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

/** Anime head in profile: spiky hair + red headband (hero) or long hair (rival). */
function drawHead(
  ctx: CanvasRenderingContext2D,
  side: Side,
  head: Vec,
  angle: number,
  t: number,
  ink: string,
  paper: string,
  accent: string,
) {
  const R = 24
  const at = (x: number, y: number) => add(head, rotate({ x, y }, angle))
  const atPolar = (a: number, r: number) => add(head, rotate(polar(a, r), angle))
  const flutter = (i: number) => Math.sin(t * 22 + i * 1.3) * 3

  ctx.fillStyle = ink
  if (side === "L") {
    // Spikes swept back by the wind.
    const spikes: [number, number][] = [
      [-1.2, 34], [-1.6, 50], [-2.0, 60], [-2.4, 58], [-2.75, 52], [-3.1, 44], [2.8, 36], [2.4, 24],
    ]
    spikes.forEach(([a, len], i) => {
      const b1 = atPolar(a - 0.3, R - 2)
      const b2 = atPolar(a + 0.3, R - 2)
      const tip = add(atPolar(a, R + len * 0.55), {
        x: -len * 0.6,
        y: -len * 0.12 + flutter(i),
      })
      ctx.beginPath()
      ctx.moveTo(b1.x, b1.y)
      ctx.lineTo(tip.x, tip.y)
      ctx.lineTo(b2.x, b2.y)
      ctx.fill()
    })
  } else {
    // Long hair and a ponytail streaming behind.
    const sway = Math.sin(t * 6) * 10
    const a = at(10, -R)
    const b = at(-R - 6, -8)
    const tip = add(head, { x: -110, y: 50 + sway })
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    const c1 = at(-10, -R - 16)
    ctx.quadraticCurveTo(c1.x, c1.y, b.x, b.y)
    ctx.quadraticCurveTo(head.x - 60, head.y - 20 + sway * 0.4, tip.x, tip.y)
    ctx.quadraticCurveTo(head.x - 50, head.y + 30, head.x - 12, head.y + 22)
    ctx.closePath()
    ctx.fill()
  }

  // Face: skull, jaw and nose in profile.
  ctx.beginPath()
  ctx.arc(head.x, head.y, R, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  const j1 = at(-6, 16)
  const chin = at(17, 21)
  const nose = at(R + 5, 2)
  const brow = at(R - 2, -10)
  ctx.moveTo(j1.x, j1.y)
  ctx.lineTo(chin.x, chin.y)
  ctx.lineTo(nose.x, nose.y)
  ctx.lineTo(brow.x, brow.y)
  ctx.closePath()
  ctx.fill()

  // Bangs over the forehead.
  for (const [bx, tx, ty] of [
    [6, 24, -2],
    [-4, 12, -4],
  ] as const) {
    const b1 = at(bx, -R)
    const b2 = at(bx + 14, -R + 6)
    const tip = at(tx, ty)
    ctx.beginPath()
    ctx.moveTo(b1.x, b1.y)
    ctx.lineTo(tip.x, tip.y)
    ctx.lineTo(b2.x, b2.y)
    ctx.fill()
  }

  // Big anime eye, cut out in paper with a sharp upper lash.
  ctx.save()
  const eye = at(13, -3)
  ctx.translate(eye.x, eye.y)
  ctx.rotate(angle)
  ctx.fillStyle = paper
  ctx.beginPath()
  ctx.moveTo(-6, 1)
  ctx.quadraticCurveTo(0, -7, 9, -3)
  ctx.quadraticCurveTo(4, 5, -6, 1)
  ctx.fill()
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(4, -1.5, 2.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  if (side === "L") {
    // Red headband and its two fluttering tails.
    const front = at(R - 1, -13)
    const knot = at(-R + 1, -7)
    ctx.strokeStyle = accent
    line(ctx, front, knot, 7)
    for (let i = 0; i < 2; i++) {
      ctx.beginPath()
      ctx.moveTo(knot.x, knot.y)
      for (let j = 1; j <= 8; j++) {
        ctx.lineTo(knot.x - j * 10, knot.y + j * (1.5 + i * 1.6) + Math.sin(t * 20 + j * 0.8 + i * 2) * j * 1.4)
      }
      ctx.lineWidth = 5 - i
      ctx.stroke()
    }
  }
}

function drawTable(ctx: CanvasRenderingContext2D, ink: string, line: string) {
  ctx.fillStyle = line
  ctx.fillRect(-2000, FLOOR + 4, STAGE_W + 4000, 3)
  ctx.fillStyle = ink
  ctx.fillRect(TABLE_L, TABLE_Y, TABLE_R - TABLE_L, 12)
  ctx.fillRect(TABLE_L + 50, TABLE_Y + 12, 8, FLOOR - TABLE_Y - 12)
  ctx.fillRect(TABLE_R - 58, TABLE_Y + 12, 8, FLOOR - TABLE_Y - 12)
  ctx.fillRect(NET_X - 2, TABLE_Y - 38, 4, 38)
  ctx.fillStyle = line
  ctx.fillRect(NET_X - 40, TABLE_Y - 34, 80, 2)
}

/** Jagged star burst, the classic anime impact shape. */
function burst(ctx: CanvasRenderingContext2D, at: Vec, radius: number, spikes: number, seed: number) {
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 + seed
    const r = i % 2 ? radius * 0.45 : radius * (0.85 + 0.3 * Math.sin(seed * 7 + i))
    ctx.lineTo(at.x + Math.cos(a) * r, at.y + Math.sin(a) * r)
  }
  ctx.closePath()
}

/** Extreme close-up of the hero's eye, manga line art; the ball shines in it. */
function drawEyeShot(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  u: number,
  c: Colors,
) {
  const s = Math.min(w, h * 1.6)
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(lerp(-0.05, 0.03, u))
  const zoom = lerp(1, 1.15, easeOut(u))
  ctx.scale(zoom, zoom)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  // Eye white (paper) with the lids in ink.
  const L = { x: -0.34 * s, y: 0.04 * s }
  const Rr = { x: 0.34 * s, y: -0.05 * s }
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(L.x, L.y)
  ctx.quadraticCurveTo(0, -0.28 * s, Rr.x, Rr.y)
  ctx.quadraticCurveTo(0.02 * s, 0.2 * s, L.x, L.y)
  ctx.clip()
  // Iris looking up-right at the incoming lob, with the red ball reflected.
  const iris = { x: lerp(0.06, 0.09, u) * s, y: -0.05 * s }
  const r = 0.15 * s
  ctx.fillStyle = c.fg
  ctx.beginPath()
  ctx.arc(iris.x, iris.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = c.bg
  ctx.lineWidth = 0.006 * s
  ctx.beginPath()
  ctx.arc(iris.x, iris.y, r * 0.72, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = c.bg
  ctx.beginPath()
  ctx.arc(iris.x - r * 0.38, iris.y - r * 0.4, r * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(iris.x + r * 0.4, iris.y + r * 0.35, r * 0.09, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.ball
  ctx.beginPath()
  ctx.arc(iris.x + r * lerp(0.05, 0.3, u), iris.y - r * lerp(0.05, 0.25, u), r * 0.14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Heavy upper lash with a flick, thin lower lid, determined brow.
  ctx.strokeStyle = c.fg
  ctx.fillStyle = c.fg
  ctx.beginPath()
  ctx.moveTo(L.x - 0.02 * s, L.y + 0.01 * s)
  ctx.quadraticCurveTo(0, -0.3 * s, Rr.x + 0.05 * s, Rr.y - 0.03 * s)
  ctx.lineTo(Rr.x + 0.1 * s, Rr.y - 0.1 * s)
  ctx.quadraticCurveTo(0, -0.36 * s, L.x - 0.02 * s, L.y + 0.01 * s)
  ctx.fill()
  ctx.lineWidth = 0.008 * s
  ctx.beginPath()
  ctx.moveTo(L.x + 0.06 * s, L.y + 0.04 * s)
  ctx.quadraticCurveTo(0.02 * s, 0.17 * s, Rr.x - 0.04 * s, Rr.y + 0.04 * s)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-0.38 * s, -0.24 * s)
  ctx.lineTo(0.36 * s, -0.36 * s)
  ctx.lineTo(0.38 * s, -0.31 * s)
  ctx.lineTo(-0.36 * s, -0.2 * s)
  ctx.fill()

  // Hair strands falling across the frame from the top.
  for (let i = 0; i < 7; i++) {
    const x = (-0.6 + i * 0.2) * s
    const sway = Math.sin(u * 6 + i) * 0.015 * s
    ctx.beginPath()
    ctx.moveTo(x - 0.06 * s, -0.7 * s)
    ctx.lineTo(x + 0.09 * s + sway, (-0.42 + (i % 3) * 0.05) * s)
    ctx.lineTo(x + 0.07 * s, -0.7 * s)
    ctx.fill()
  }

  // Glint: a four-point sparkle flashing on the highlight.
  const g = Math.sin(clamp((u - 0.35) / 0.4) * Math.PI)
  if (g > 0) {
    const at = { x: iris.x - r * 0.38, y: iris.y - r * 0.4 }
    const len = g * 0.12 * s
    ctx.fillStyle = c.bg
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3
      const rr = i % 2 ? len * 0.12 : len
      ctx.lineTo(at.x + Math.cos(a) * rr, at.y + Math.sin(a) * rr)
    }
    ctx.fill()
  }
  ctx.restore()
}

type Line = { a: number; b: number; len: number; speed: number; width: number }
type Camera = { x: number; y: number; zoom: number; rot: number }

export function AnimeIntro({
  name,
  sfx,
  skipLabel,
  loadingLabel,
}: {
  name: string
  sfx: string
  skipLabel: string
  loadingLabel: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const skipRef = useRef<() => void>(() => {})
  const [phase, setPhase] = useState<Phase>("loading")

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return
    const landing = root.closest("[data-motion]")

    let state: Phase = "loading"
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

    let fontsReady = false
    document.fonts.ready.then(() => (fontsReady = true))

    // Canvas follows the viewport size and pixel ratio.
    let width = 0
    let height = 0
    let dpr = 1
    const resize = () => {
      dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    const path = buildBallPath()
    const random = (n: number): Line[] =>
      Array.from({ length: n }, () => ({
        a: Math.random(),
        b: Math.random(),
        len: 0.1 + Math.random() * 0.35,
        speed: 0.6 + Math.random() * 1.4,
        width: 1 + Math.random() * 3,
      }))
    const speedLines = random(30)
    let focusLines = random(70)
    let focusAt = 0

    const readColors = (): Colors => {
      const style = getComputedStyle(root)
      const fg = style.getPropertyValue("--foreground").trim() || style.color
      return {
        bg: style.getPropertyValue("--background").trim() || "#fff",
        fg,
        ball: style.getPropertyValue("--primary").trim() || fg,
        line: style.getPropertyValue("--border").trim() || fg,
        font: style.fontFamily,
      }
    }

    /** Camera for each shot: always moving, hard cuts between shots. */
    const camera = (scene: number, world: number): Camera => {
      if (scene < CUT.track) {
        // Establishing: fast dolly-in from a low, tilted wide shot.
        const u = easeInOut(scene / CUT.track)
        return { x: lerp(560, 800, u), y: lerp(660, 560, u), zoom: lerp(0.8, 1.3, u), rot: lerp(0.12, -0.04, u) }
      }
      if (scene < CUT.eye) {
        // Tracking: pans with the ball (with lag), rolls towards its direction,
        // punches in on every hit.
        const lag = ballAt(path, world - 0.12)
        const prev = ballAt(path, world - 0.17)
        let punch = 0
        for (const hit of HITS) {
          const d = world - hit.t
          if (d >= 0 && d < 0.2) punch = Math.max(punch, 1 - d / 0.2)
        }
        return {
          x: clamp(lag.x, 430, 1170),
          y: 520 + (lag.y - 500) * 0.35,
          zoom: 1.85 + punch * 0.3,
          rot: Math.tanh((lag.x - prev.x) / 25) * 0.07,
        }
      }
      if (scene < CUT.impact) {
        // Low angle on the hero jumping (the eye shot is drawn separately).
        const u = (scene - CUT.jump) / (CUT.impact - CUT.jump)
        const k = skeleton(pose("L", world))
        return { x: k.shoulder.x + 80, y: k.shoulder.y + 15, zoom: lerp(2, 2.4, u), rot: lerp(-0.2, -0.1, u) }
      }
      if (scene < CUT.slam) {
        const u = (scene - CUT.impact) / (CUT.slam - CUT.impact)
        const smash = paddleAt("L", SMASH_T)
        return { x: smash.x + 40, y: smash.y + 120, zoom: lerp(2.4, 3, easeOut(u)), rot: lerp(-0.14, -0.02, u) }
      }
      if (scene < CUT.wide) {
        // Slam, then whip pan up after the ball.
        const lag = ballAt(path, world - 0.025)
        const up = clamp((world - SLAM_T) / 0.12)
        return {
          x: lerp(TABLE_R - 160, lag.x, up * 0.5),
          y: lerp(TABLE_Y - 40, Math.max(lag.y + 120, -1250), easeOut(up)),
          zoom: lerp(2.2, 1.4, up),
          rot: lerp(0.06, 0.16, up),
        }
      }
      const u = (scene - CUT.wide) / (CUT.end - CUT.wide)
      return { x: 800, y: lerp(470, 440, u), zoom: lerp(1.15, 1.05, u), rot: lerp(0.05, 0.03, u) }
    }

    const drawScene = (scene: number, now: number) => {
      const c = readColors()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const world = worldAt(scene)
      const impact = scene >= CUT.impact && scene < CUT.slam
      const ink = impact ? c.bg : c.fg
      const paper = impact ? c.fg : c.bg
      ctx.fillStyle = paper
      ctx.fillRect(0, 0, width, height)

      // Screen-space speed lines: horizontal in the rally, vertical when the
      // action goes up (jump, ball flying away).
      const vertical = (scene >= CUT.jump && scene < CUT.impact) || world > SLAM_T
      if (!impact) {
        ctx.fillStyle = c.line
        for (const l of speedLines) {
          const run = (l.b + scene * l.speed * (vertical ? 1.2 : 0.6)) % 1
          if (vertical) {
            ctx.fillRect(l.a * width, (run * 1.4 - 0.2) * height, l.width, l.len * height)
          } else {
            ctx.fillRect((1.2 - run * 1.4) * width, l.a * height, l.len * width, l.width)
          }
        }
      }

      if (scene >= CUT.eye && scene < CUT.jump) {
        drawEyeShot(ctx, width, height, (scene - CUT.eye) / (CUT.jump - CUT.eye), c)
      } else {
        const cam = camera(scene, world)
        let shake = 0
        for (const hit of HITS) {
          const d = world - hit.t
          if (d >= 0 && d < 0.2 && hit.kind !== "whiff") shake = Math.max(shake, 7 * (1 - d / 0.2))
        }
        const slam = world - SLAM_T
        if (slam >= 0 && slam < 0.45) shake = Math.max(shake, 30 * (1 - slam / 0.45))
        if (impact) shake = 5
        const fit = Math.min(width / 1450, height / 850)
        ctx.save()
        ctx.translate(width / 2 + Math.sin(now * 0.09) * shake, height / 2 + Math.cos(now * 0.07) * shake)
        ctx.rotate(cam.rot)
        ctx.scale(fit * cam.zoom, fit * cam.zoom)
        ctx.translate(-cam.x, -cam.y)

        const ball = ballAt(path, world)
        if (impact) {
          // Impact frame: inverted colors, focus lines converging on the ball.
          if (now - focusAt > 60) {
            focusLines = random(70)
            focusAt = now
          }
          ctx.fillStyle = ink
          const far = 1600
          for (const l of focusLines) {
            const a = l.a * Math.PI * 2
            const inner = 150 + l.b * 140
            const spread = 0.004 + l.width * 0.004
            ctx.beginPath()
            ctx.moveTo(ball.x + Math.cos(a) * inner, ball.y + Math.sin(a) * inner)
            ctx.lineTo(ball.x + Math.cos(a - spread) * far, ball.y + Math.sin(a - spread) * far)
            ctx.lineTo(ball.x + Math.cos(a + spread) * far, ball.y + Math.sin(a + spread) * far)
            ctx.fill()
          }
        }

        drawTable(ctx, ink, impact ? ink : c.line)
        const colors = { ink, paper, accent: c.ball }
        drawPlayer(ctx, "R", world, colors, impact)
        drawPlayer(ctx, "L", world, colors, impact)

        // Hit bursts.
        ctx.strokeStyle = ink
        ctx.lineWidth = 4
        for (const hit of HITS) {
          const d = world - hit.t
          if (hit.kind === "whiff" || d < 0 || d > 0.14) continue
          burst(ctx, paddleAt(hit.side, hit.t), 40 + d * 300, 9, hit.t)
          ctx.stroke()
        }
        if (slam >= 0 && slam < 0.3) {
          const at = { x: TABLE_R - 110, y: TABLE_Y }
          ctx.fillStyle = c.ball
          ctx.globalAlpha = 1 - slam / 0.3
          burst(ctx, at, 80 + slam * 600, 12, 1.3)
          ctx.fill()
          ctx.globalAlpha = 1
          ctx.stroke()
        }

        // Ball with a motion trail (a long streak once it is smashed).
        ctx.fillStyle = c.ball
        const fast = world > SMASH_T
        const trail = fast ? 16 : 8
        const gap = fast ? 0.008 : 0.012
        for (let i = trail; i >= 1; i--) {
          const prev = ballAt(path, Math.max(world - i * gap, HITS[0].t))
          ctx.globalAlpha = (1 - i / (trail + 1)) * 0.35
          ctx.beginPath()
          ctx.arc(prev.x, prev.y, BALL_R * (1 - i / (trail * 2)), 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, impact ? BALL_R * 1.2 : BALL_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (impact) {
        // Sound effect lettering, punched in.
        const local = scene - CUT.impact
        const size = Math.min(width, height * 1.6) * 0.16
        const punch = lerp(1.7, 1, easeOut(clamp(local / 0.14)))
        ctx.save()
        ctx.translate(width * 0.62, height * 0.3)
        ctx.rotate(-0.12)
        ctx.scale(punch, punch)
        ctx.font = `900 ${size}px ${c.font}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = c.ball
        ctx.fillText(sfx, size * 0.05, size * 0.05)
        ctx.fillStyle = ink
        ctx.fillText(sfx, 0, 0)
        ctx.restore()
      }

      // Flash frames on the hard cuts.
      for (const cut of [CUT.track, CUT.eye, CUT.jump, CUT.impact, CUT.wide]) {
        const d = scene - cut
        if (d >= 0 && d < 0.05) {
          ctx.fillStyle = c.bg
          ctx.fillRect(0, 0, width, height)
        }
      }

      // Cinema bars slide in at the start of the scene.
      const bar = easeOut(clamp(scene / 0.5)) * height * 0.08
      ctx.fillStyle = c.fg
      ctx.fillRect(0, 0, width, bar)
      ctx.fillRect(0, height - bar, width, bar)
    }

    // Loader: starts slowly and stalls a little, like a real load.
    const progress = (t: number) =>
      keyed(t, [
        [0, 0],
        [0.4, 0.1, easeIn],
        [0.6, 0.42],
        [0.72, 0.48],
        [0.9, 0.88],
        [1, 1, easeOut],
      ])

    const start = performance.now()
    let sceneStart = 0
    let leaveStart = 0
    let frame = 0
    const loop = (now: number) => {
      if (state === "loading") {
        let p = progress(clamp((now - start) / LOADER_MS))
        if (!fontsReady) p = Math.min(p, 0.9)
        if (counterRef.current) counterRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0")
        if (barRef.current) barRef.current.style.scale = `${p} 1`
        if (p >= 1) {
          sceneStart = now
          go("scene")
        }
      }
      if (state === "scene" || state === "leaving") {
        const scene = (now - sceneStart) / 1000
        drawScene(Math.min(scene, SCENE_END + 1), now)
        if (state === "scene" && scene >= SCENE_END) {
          leaveStart = now
          go("leaving")
        }
      }
      if (state === "leaving" && now - leaveStart >= LEAVE_MS) {
        html.style.overflow = previousOverflow
        go("done")
        return
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    skipRef.current = () => {
      if (state === "done" || state === "leaving") return
      leaveStart = performance.now()
      if (state === "loading") sceneStart = leaveStart - SCENE_END * 1000
      go("leaving")
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      html.style.overflow = previousOverflow
    }
  }, [sfx])

  if (phase === "done") return null

  const Logo = logos.stack.Full

  return (
    <div ref={rootRef} className="lp-intro fixed inset-0 z-[100] bg-background text-foreground" data-phase={phase}>
      <canvas ref={canvasRef} className="lp-intro-canvas absolute inset-0 size-full" aria-hidden />
      <div className="lp-intro-loader absolute inset-0 flex flex-col items-center justify-center gap-8 px-4">
        <Logo name={name} size={112} />
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
      <Button
        variant="outline"
        className="absolute right-4 bottom-[calc(8vh+1rem)] z-10 text-xs font-semibold tracking-widest uppercase"
        onClick={() => skipRef.current()}
      >
        {skipLabel}
      </Button>
    </div>
  )
}
