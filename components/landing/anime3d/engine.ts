import * as THREE from "three"

import { createPost, enableShadows, inked, makeKit, SCENE_THEME, toColor, type Kit, type Theme } from "./kit"
import { makeCastKit } from "./lab"
import { BLADE_THICKNESS, heroMood, makeRig, rivalMood, swingPose, type CharacterStyle, type Rig, REST } from "./rig"

// Cel-shaded 3D "anime" intro: two school boys play a table-tennis rally that
// ends on a jump smash. Loaded lazily by components/landing/anime3d/intro.tsx.
// Units are meters; the table is centered on the origin, along the x axis.
// The hero (gakuran, red headband) plays from -x, the rival (white shirt,
// glasses, red tie) from +x.

export type Variant = "gym" | "rooftop" | "manga"
export type Side = "L" | "R"
export type { Theme }

/** What the 2D overlay needs to know about the current frame. */
export type Frame = {
  impact: boolean
  invert: boolean
  lines: "none" | "horizontal" | "vertical"
  flash: boolean
  bars: boolean
}

type Hit = { side: Side; t: number; kind: "drive" | "lob" | "smash" | "whiff"; z: number }
type Shot = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number }

// ── Timeline (scene seconds → world seconds) ───────────────────────

export const CUT = {
  rally: 1.4,
  close: 2.5, // slow motion starts
  impact: 3.3, // freeze
  slam: 4.3,
  end: 5.9,
}

const SPEED: [number, number][] = [
  [0, 1],
  [CUT.close, 0.35],
  [CUT.impact, 0],
  [CUT.slam, 1],
  // The ending (ball up into the sky and back down at the camera) a touch
  // slower, so the last beat lands.
  [CUT.slam + 0.35, 0.7],
]

export function worldAt(scene: number) {
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
const SLAM_T = SMASH_T + 0.16
const LAND_T = worldAt(CUT.end) // the ball reaches the camera as the scene ends
const FALL_T = (SLAM_T + LAND_T) / 2

const HITS: Hit[] = [
  { side: "R", t: -0.5, kind: "drive", z: 0.2 },
  { side: "L", t: 0.35, kind: "drive", z: -0.3 },
  { side: "R", t: 1.0, kind: "drive", z: 0.35 },
  { side: "L", t: 1.6, kind: "drive", z: 0.1 },
  { side: "R", t: 2.2, kind: "lob", z: -0.2 },
  { side: "L", t: SMASH_T, kind: "smash", z: 0 },
  { side: "R", t: SLAM_T + 0.05, kind: "whiff", z: 0.3 },
]

const TABLE_H = 0.76
const TABLE_L = 2.74
const TABLE_W = 1.525
const BALL_R = 0.03
/** Drawn ball radius (bigger than a real one, so it reads on screen). */
const BALL_SIZE = BALL_R * 1.6
const BLADE_HALF = BLADE_THICKNESS / 2
/** How much the ball flattens against the blade in the smash freeze. */
const SQUASH = 0.22
const PLAYER_X = 1.9

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

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

/** Lateral footwork: the player slides towards where he will hit. */
function footZ(side: Side, t: number) {
  const own = HITS.filter((h) => h.side === side)
  const keys = own.map((h) => [h.t - 0.25, h.z * 0.6] as [number, number])
  return keyed(t, keys)
}

/** Drives a rig from the rally timeline. */
function player(rig: Rig, side: Side) {
  const hero = side === "L"
  const dir = hero ? 1 : -1
  rig.root.rotation.y = hero ? 0 : Math.PI
  const pose = (t: number) => {
    let swing = REST
    for (const hit of HITS) {
      if (hit.side !== side) continue
      const d = t - hit.t
      if (d >= -0.5 && d <= 0.8) {
        swing = swingPose(hit.kind, d)
        break
      }
    }
    const d = t - SMASH_T
    const lift = hero ? Math.max(0, 1 - ((d + 0.03) / 0.4) ** 2) * 0.55 : 0
    rig.root.position.set(-dir * PLAYER_X, 0, footZ(side, t) * dir)
    rig.apply({
      t,
      swing,
      lift,
      look: easeOut(clamp((t - SLAM_T - 0.05) / 0.35)),
      whip: hero ? clamp(1 - Math.abs(d) / 0.3) : 0,
      bob: Math.sin(t * 9 + (hero ? 0 : 1.7)) * 0.015,
      mood: hero ? heroMood(d) : rivalMood(d),
    })
  }
  /**
   * Where the ball sits when this player hits it at `t`: against the blade's
   * front face (the one facing the opponent), never through the blade.
   * `normal` is that face's direction.
   */
  const contactAt = (t: number, squash = 0) => {
    pose(t)
    const center = rig.sweet.getWorldPosition(new THREE.Vector3())
    // The blade is a cylinder: its face normal is the sweet spot's local y.
    const normal = new THREE.Vector3(0, 1, 0).transformDirection(rig.sweet.matrixWorld)
    if (normal.x * dir < 0) normal.negate()
    const point = center.addScaledVector(normal, BALL_SIZE * (1 - squash) + BLADE_HALF)
    return { point, normal }
  }
  const paddleAt = (t: number, squash = 0) => contactAt(t, squash).point
  const headAt = () => rig.skull.getWorldPosition(new THREE.Vector3())
  return { pose, paddleAt, contactAt, headAt, head: rig.head }
}

// ── Ball path ────────────────────────────────────────────────────

type Segment = { t0: number; t1: number; from: THREE.Vector3; to: THREE.Vector3; arc: number }

function buildPath(paddleAt: (side: Side, t: number, squash?: number) => THREE.Vector3): Segment[] {
  const segments: Segment[] = []
  const strokes = HITS.filter((h) => h.kind !== "whiff")
  for (let i = 0; i < strokes.length - 1; i++) {
    const a = strokes[i]
    const b = strokes[i + 1]
    const from = paddleAt(a.side, a.t)
    const to = paddleAt(b.side, b.t)
    const lob = a.kind === "lob"
    const tb = lerp(a.t, b.t, lob ? 0.35 : 0.58)
    const bounce = new THREE.Vector3(b.side === "R" ? 0.75 : -0.75, TABLE_H + BALL_R, lerp(from.z, to.z, 0.6))
    segments.push({ t0: a.t, t1: tb, from, to: bounce, arc: lob ? 0.35 : 0.18 })
    segments.push({ t0: tb, t1: b.t, from: bounce, to, arc: lob ? 1.3 : 0.15 })
  }
  // Smash: the ball is pressed flat against the blade in the freeze.
  const smash = paddleAt("L", SMASH_T, SQUASH)
  const slam = new THREE.Vector3(0.95, TABLE_H + BALL_R, 0.25)
  segments.push({ t0: SMASH_T, t1: SLAM_T, from: smash, to: slam, arc: 0 })
  // Up into the sky, then back down onto the camera of the manga ending.
  const apex = new THREE.Vector3(0.4, 6, 2)
  segments.push({ t0: SLAM_T, t1: FALL_T, from: slam, to: apex, arc: 0 })
  segments.push({ t0: FALL_T, t1: LAND_T, from: apex, to: CATCH, arc: 0 })
  return segments
}

function ballAt(path: Segment[], t: number, out = new THREE.Vector3()) {
  const seg = path.find((s) => t <= s.t1) ?? path[path.length - 1]
  const s = clamp((t - seg.t0) / (seg.t1 - seg.t0))
  out.lerpVectors(seg.from, seg.to, s)
  out.y += seg.arc * 4 * s * (1 - s)
  return out
}

// ── Environments ─────────────────────────────────────────────────

function canvasTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 512) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")
  if (ctx) draw(ctx, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function buildTable(kit: Kit, c: { ink: THREE.Color; paper: THREE.Color; table: THREE.Color }) {
  const group = new THREE.Group()
  const top = new THREE.Mesh(new THREE.BoxGeometry(TABLE_L, 0.04, TABLE_W), kit.toon(c.table))
  kit.disposables.push(top.geometry)
  top.castShadow = true
  top.position.y = TABLE_H - 0.02
  group.add(top)
  // White border and center line.
  const lines: [number, number, number, number][] = [
    [0, TABLE_W / 2 - 0.01, TABLE_L, 0.02],
    [0, -TABLE_W / 2 + 0.01, TABLE_L, 0.02],
    [TABLE_L / 2 - 0.01, 0, 0.02, TABLE_W],
    [-TABLE_L / 2 + 0.01, 0, 0.02, TABLE_W],
    [0, 0, TABLE_L, 0.006],
  ]
  for (const [x, z, w, d] of lines) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.002, d), kit.toon(c.paper))
    kit.disposables.push(strip.geometry)
    strip.position.set(x, TABLE_H + 0.001, z)
    group.add(strip)
  }
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      const leg = inked(kit, new THREE.BoxGeometry(0.05, TABLE_H - 0.04, 0.05), c.ink, false)
      leg.position.set(x * (TABLE_L / 2 - 0.25), (TABLE_H - 0.04) / 2, z * (TABLE_W / 2 - 0.15))
      group.add(leg)
    }
  }
  const net = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.15, TABLE_W + 0.3),
    new THREE.MeshBasicMaterial({ color: c.ink, transparent: true, opacity: 0.55 }),
  )
  kit.disposables.push(net.geometry, net.material as THREE.Material)
  net.position.y = TABLE_H + 0.075
  group.add(net)
  return group
}

type Env = { update?: (world: number) => void; sun?: THREE.Vector3 }

function buildGym(scene: THREE.Scene, kit: Kit, c: Palette): Env {
  const floorTexture = canvasTexture((ctx, size) => {
    ctx.fillStyle = c.css.paper
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = c.css.line
    ctx.lineWidth = 2
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(size, i)
      ctx.stroke()
    }
  })
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
  floorTexture.repeat.set(6, 6)
  kit.disposables.push(floorTexture)
  const floorMaterial = new THREE.MeshToonMaterial({ map: floorTexture })
  kit.disposables.push(floorMaterial)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMaterial)
  kit.disposables.push(floor.geometry)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)
  // Red court lines on the floor.
  for (const [w, d, x, z] of [
    [12, 0.08, 0, -4],
    [12, 0.08, 0, 4],
    [0.08, 8, -6, 0],
    [0.08, 8, 6, 0],
  ]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, d), kit.toon(c.accent))
    kit.disposables.push(strip.geometry)
    strip.rotation.x = -Math.PI / 2
    strip.position.set(x, 0.003, z)
    scene.add(strip)
  }
  // Walls with tall windows and hanging banners.
  for (const [x, z, ry] of [
    [0, -9, 0],
    [-11, 0, Math.PI / 2],
    [11, 0, -Math.PI / 2],
  ]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(22, 8), kit.toon(c.paper))
    kit.disposables.push(wall.geometry)
    wall.position.set(x, 4, z)
    wall.rotation.y = ry
    scene.add(wall)
    for (let i = -3; i <= 3; i++) {
      const window = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), kit.toon(c.line))
      kit.disposables.push(window.geometry)
      window.position.set(i * 3, 5.2, 0.02)
      wall.add(window)
      if (i % 2 === 0) {
        const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2), kit.toon(c.accent))
        kit.disposables.push(banner.geometry)
        banner.position.set(i * 3 + 1.5, 2.4, 0.03)
        wall.add(banner)
      }
    }
    const trim = new THREE.Mesh(new THREE.PlaneGeometry(22, 1), kit.toon(c.ink))
    kit.disposables.push(trim.geometry)
    trim.position.set(0, -3.5, 0.01)
    wall.add(trim)
  }
  return {}
}

function buildRooftop(scene: THREE.Scene, kit: Kit, c: Palette): Env {
  // Sunset sky dome: ink at the top, the red accent at the horizon.
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { top: { value: c.ink }, horizon: { value: c.accent }, glow: { value: c.paper } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 top; uniform vec3 horizon; uniform vec3 glow;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 c = mix(mix(glow, horizon, smoothstep(0.0, 0.12, h)), top, smoothstep(0.1, 0.65, h));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
  kit.disposables.push(skyMaterial)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), skyMaterial)
  kit.disposables.push(sky.geometry)
  scene.add(sky)
  // Low sun behind the hero, so he jumps in silhouette.
  const sun = new THREE.Vector3(-30, 6, -24)
  const disc = new THREE.Mesh(new THREE.CircleGeometry(4, 40), new THREE.MeshBasicMaterial({ color: c.paper }))
  kit.disposables.push(disc.geometry, disc.material as THREE.Material)
  disc.position.copy(sun)
  disc.lookAt(0, 0, 0)
  scene.add(disc)

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), kit.toon(c.line))
  kit.disposables.push(floor.geometry)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)
  // Fence posts and rails around the roof.
  const post = new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6)
  kit.disposables.push(post)
  for (let i = -7; i <= 7; i += 0.7) {
    for (const z of [-5, 5]) {
      const p = new THREE.Mesh(post, kit.toon(c.ink))
      p.position.set(i, 1.1, z)
      scene.add(p)
    }
  }
  for (let i = -5; i <= 5; i += 0.7) {
    for (const x of [-7, 7]) {
      const p = new THREE.Mesh(post, kit.toon(c.ink))
      p.position.set(x, 1.1, i)
      scene.add(p)
    }
  }
  for (const y of [0.1, 2.2]) {
    for (const [w, d, x, z] of [
      [14, 0.05, 0, -5],
      [14, 0.05, 0, 5],
      [0.05, 10, -7, 0],
      [0.05, 10, 7, 0],
    ]) {
      const rail = inked(kit, new THREE.BoxGeometry(w, 0.05, d), c.ink, false)
      rail.position.set(x, y, z)
      scene.add(rail)
    }
  }
  const tank = inked(kit, new THREE.CylinderGeometry(1, 1, 2, 20), c.paper)
  tank.position.set(4.5, 2.6, -3.5)
  scene.add(tank)

  // Cherry blossom petals drifting through the shot (frozen with time).
  const count = 260
  const seeds = Array.from({ length: count }, () => [Math.random(), Math.random(), Math.random()])
  const positions = new Float32Array(count * 3)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({ color: c.petal, size: 0.05 })
  kit.disposables.push(geometry, material)
  scene.add(new THREE.Points(geometry, material))
  const update = (world: number) => {
    for (let i = 0; i < count; i++) {
      const [a, b, s] = seeds[i]
      const t = world * (0.3 + s * 0.3) + a * 10
      positions[i * 3] = ((a * 16 + t * 1.2) % 16) - 8
      positions[i * 3 + 1] = 4 - ((b * 5 + t * 0.6) % 4.5)
      positions[i * 3 + 2] = Math.sin(t * 2 + s * 6) * 0.4 + (s - 0.5) * 9
    }
    geometry.attributes.position.needsUpdate = true
  }
  return { update, sun }
}

function buildClubRoom(scene: THREE.Scene, kit: Kit, c: Palette): Env {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), kit.toon(c.paper))
  kit.disposables.push(floor.geometry)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), kit.toon(c.paper))
  kit.disposables.push(wall.geometry)
  wall.position.set(0, 2.5, -4)
  scene.add(wall)
  // Blackboard and windows: big flat shapes read well in screentone.
  const board = inked(kit, new THREE.BoxGeometry(5, 1.6, 0.05), c.ink, false)
  board.position.set(-1, 2.2, -3.95)
  scene.add(board)
  for (let i = 0; i < 4; i++) {
    const frame = inked(kit, new THREE.BoxGeometry(0.08, 2.4, 1.6), c.ink, false)
    frame.position.set(6, 2.2, -3 + i * 1.8)
    scene.add(frame)
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), kit.toon(c.line))
  kit.disposables.push(back.geometry)
  back.position.set(7, 2.5, 0)
  back.rotation.y = -Math.PI / 2
  scene.add(back)
  return {}
}

// ── Directors: one camera script per variant ───────────────────

type Ctx = {
  scene: number
  world: number
  /** Direction of the blade's face at the smash (also the ball's flight). */
  smashNormal: THREE.Vector3
  ball: (t: number) => THREE.Vector3
  hero: () => THREE.Vector3
  rival: () => THREE.Vector3
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const UP = v(0, 1, 0)

/** Point on a sphere around `center` (azimuth around y, elevation from the ground). */
const orbit = (center: THREE.Vector3, radius: number, azimuth: number, elevation: number) =>
  v(
    center.x + Math.cos(azimuth) * Math.cos(elevation) * radius,
    center.y + Math.sin(elevation) * radius,
    center.z + Math.sin(azimuth) * Math.cos(elevation) * radius,
  )

const TABLE_CENTER = v(0, TABLE_H, 0)
/** Manga ending: camera low by the table, and where the falling ball stops. */
const CAMERA_DOWN = v(-0.9, 0.9, 2.6)
const CATCH = v(-0.82, 1.02, 2.45)

function dollyZoom(target: THREE.Vector3, dir: THREE.Vector3, u: number, from: number, to: number): Shot {
  // Keeps the subject the same size while the background stretches.
  const distance = lerp(from, to, easeInOut(u))
  const frame = 1.3
  return {
    pos: target.clone().addScaledVector(dir.clone().normalize(), distance),
    look: target,
    fov: THREE.MathUtils.radToDeg(2 * Math.atan(frame / (2 * distance))),
    roll: lerp(-0.12, 0.05, u),
  }
}

function slamShot(x: Ctx, u: number): Shot {
  // Low at table level, then tilt up after the ball as it rockets away.
  const up = clamp((x.world - SLAM_T) / 0.6)
  const slam = v(0.95, TABLE_H, 0.25)
  // Keep the table in frame while tilting up after the ball.
  const ball = x.ball(x.world)
  ball.y = Math.min(ball.y, 2.4)
  const look = slam.clone().lerp(ball, 0.6 * easeOut(up))
  return {
    pos: v(lerp(-0.2, -1.2, u), lerp(0.95, 1.5, easeOut(up)), lerp(1.5, 2.6, u)),
    look,
    fov: lerp(45, 72, easeIn(up)),
    roll: lerp(0.08, -0.15, up),
  }
}

const directors: Record<Variant, (x: Ctx) => Shot & { frame: Frame }> = {
  // Gym: the 2D Pong court seen from above tilts into the 3D gym, then
  // over-the-shoulder reverse shots, a dolly zoom and a bullet-time orbit.
  gym: (x) => {
    const base: Frame = { impact: false, invert: false, lines: "none", flash: false, bars: true }
    const s = x.scene
    if (s < CUT.rally) {
      const u = easeInOut(clamp(s / CUT.rally))
      return {
        pos: orbit(TABLE_CENTER, lerp(6.5, 4.2, u), lerp(Math.PI / 2, 1.2, u), lerp(1.55, 0.3, u)),
        look: TABLE_CENTER,
        fov: lerp(32, 48, u),
        roll: 0,
        frame: { ...base, bars: u > 0.4 },
      }
    }
    if (s < 1.95) {
      const u = (s - CUT.rally) / 0.55
      return {
        pos: v(-2.95 + u * 0.2, 1.75, 0.75),
        look: v(1.6, 1.0, -0.1),
        fov: 50,
        roll: 0.04,
        frame: { ...base, flash: s - CUT.rally < 0.05, lines: "horizontal" },
      }
    }
    if (s < CUT.close) {
      const u = (s - 1.95) / (CUT.close - 1.95)
      return {
        pos: v(2.95 - u * 0.2, 1.7, -0.7),
        look: v(-1.6, 1.1 + u * 0.3, 0.1),
        fov: 50,
        roll: -0.05,
        frame: { ...base, flash: s - 1.95 < 0.05, lines: "horizontal" },
      }
    }
    if (s < CUT.impact) {
      const u = (s - CUT.close) / (CUT.impact - CUT.close)
      const shot = dollyZoom(x.hero(), v(1, -0.25, 1.1), u, 1.1, 4)
      return { ...shot, frame: { ...base, flash: s - CUT.close < 0.05, lines: "vertical" } }
    }
    if (s < CUT.slam) {
      const u = (s - CUT.impact) / (CUT.slam - CUT.impact)
      const center = x.ball(x.world)
      return {
        pos: orbit(center, 1.7, lerp(1.9, 4.6, easeInOut(u)), lerp(0.1, 0.35, u)),
        look: center,
        fov: 45,
        roll: lerp(0.2, -0.1, u),
        frame: { ...base, impact: true, invert: u < 0.25, flash: s - CUT.impact < 0.05 },
      }
    }
    const shot = slamShot(x, (s - CUT.slam) / (CUT.end - CUT.slam))
    return { ...shot, frame: { ...base, lines: x.world > SLAM_T ? "vertical" : "none" } }
  },

  // Rooftop at sunset: a slow descending crane, a low tracking dolly, the
  // hero in silhouette against the sun, a full 360° orbit in bullet time.
  rooftop: (x) => {
    const base: Frame = { impact: false, invert: false, lines: "none", flash: false, bars: true }
    const s = x.scene
    if (s < 1.5) {
      const u = easeInOut(s / 1.5)
      return {
        pos: orbit(TABLE_CENTER, lerp(8, 4.4, u), lerp(-0.4, -1.6, u), lerp(0.95, 0.22, u)),
        look: TABLE_CENTER,
        fov: 45,
        roll: lerp(0.1, 0, u),
        frame: base,
      }
    }
    if (s < CUT.close) {
      const lag = x.ball(x.world - 0.15)
      const prev = x.ball(x.world - 0.2)
      return {
        pos: v(lag.x * 0.8, 0.55, -2.3),
        look: v(lag.x, 0.95, 0),
        fov: 52,
        roll: Math.tanh((lag.x - prev.x) / 0.08) * 0.08,
        frame: { ...base, flash: s - 1.5 < 0.05, lines: "horizontal" },
      }
    }
    if (s < CUT.impact) {
      const u = (s - CUT.close) / (CUT.impact - CUT.close)
      const head = x.hero()
      return {
        pos: head.clone().add(v(lerp(2.4, 1.6, u), lerp(-1.0, -0.8, u), lerp(1.9, 1.3, u))),
        look: head.clone().add(v(0, 0.25, 0)),
        fov: 50,
        roll: lerp(0.15, 0.05, u),
        frame: { ...base, flash: s - CUT.close < 0.05, lines: "vertical" },
      }
    }
    if (s < CUT.slam) {
      const u = (s - CUT.impact) / (CUT.slam - CUT.impact)
      const center = x.ball(x.world)
      return {
        pos: orbit(center, 2.1, lerp(-2.4, -2.4 + Math.PI * 2, easeInOut(u)), 0.15),
        look: center,
        fov: 50,
        roll: 0,
        frame: { ...base, impact: true, flash: s - CUT.impact < 0.05 },
      }
    }
    const u = (s - CUT.slam) / (CUT.end - CUT.slam)
    const up = clamp((x.world - SLAM_T) / 0.6)
    const ball = x.ball(x.world)
    ball.y = Math.min(ball.y, 2.6)
    const look = v(0.95, TABLE_H, 0.25).lerp(ball, 0.6 * easeOut(up))
    return {
      pos: v(lerp(1.6, 3.6, u), lerp(1.1, 2.6, easeIn(up)), lerp(1.8, 4.2, u)),
      look,
      fov: lerp(50, 66, up),
      roll: lerp(0, -0.12, up),
      frame: { ...base, lines: up > 0 ? "vertical" : "none" },
    }
  },

  // Manga: screentone shading, first-person views from both players, a net
  // cam, an overhead spin, then the camera rides the ball into the sky.
  manga: (x) => {
    const base: Frame = { impact: false, invert: false, lines: "horizontal", flash: false, bars: false }
    const s = x.scene
    if (s < 1.2) {
      // Rival's eyes: the ball comes straight at you.
      const eye = x.rival()
      const ball = x.ball(x.world)
      return {
        pos: eye.clone().add(v(0.02, 0.02, 0)),
        look: v(lerp(-1.8, ball.x, 0.4), lerp(1.05, ball.y, 0.4), lerp(0, ball.z, 0.4)),
        fov: 70,
        roll: Math.sin(s * 6) * 0.03,
        frame: { ...base, lines: "none" },
      }
    }
    if (s < 2) {
      const u = (s - 1.2) / 0.8
      return {
        pos: v(lerp(0.3, -0.2, u), 0.84, 1.0),
        look: x.ball(x.world),
        fov: lerp(60, 40, u),
        roll: 0.25,
        frame: { ...base, flash: s - 1.2 < 0.05 },
      }
    }
    if (s < CUT.close) {
      // Hero's eyes, looking up at the lob.
      const eye = x.hero()
      return {
        pos: eye.clone().add(v(-0.02, 0.02, 0)),
        look: x.ball(x.world),
        fov: 70,
        roll: -0.05,
        frame: { ...base, flash: s - 2 < 0.05, lines: "none" },
      }
    }
    if (s < CUT.impact) {
      const u = (s - CUT.close) / (CUT.impact - CUT.close)
      const head = x.hero()
      return {
        pos: head.clone().add(v(0.05, lerp(3.2, 1.6, easeOut(u)), 0.01)),
        look: head,
        fov: 55,
        roll: lerp(0, Math.PI * 0.75, easeInOut(u)),
        frame: { ...base, flash: s - CUT.close < 0.05, lines: "vertical" },
      }
    }
    if (s < CUT.slam) {
      // Freeze: the camera swings from the side round into the ball's flight
      // (screen right) and creeps closer, so the ball is aimed at the viewer;
      // the blade's black face rings the red ball from behind.
      const u = (s - CUT.impact) / (CUT.slam - CUT.impact)
      const center = x.ball(x.world)
      const side = v(-x.smashNormal.z, 0, x.smashNormal.x).normalize()
      const swing = lerp(0.85, 1.2, easeInOut(u)) // radians from profile
      const dir = side.multiplyScalar(Math.cos(swing)).addScaledVector(x.smashNormal, Math.sin(swing))
      return {
        pos: center
          .clone()
          .addScaledVector(dir, lerp(1.35, 0.9, easeIn(u)))
          .add(v(0, -0.12, 0)),
        look: center,
        fov: lerp(50, 40, easeIn(u)),
        roll: -0.3,
        frame: { ...base, impact: true, invert: true, flash: s - CUT.impact < 0.05, lines: "none" },
      }
    }
    if (x.world < SLAM_T + 0.25) {
      // Ride behind the ball down onto the table.
      const behind = x.ball(x.world - 0.05)
      return {
        pos: behind.clone().add(v(-0.25, 0.35, 0.2)),
        look: x.ball(x.world),
        fov: 75,
        roll: 0.2,
        frame: { ...base, lines: "vertical" },
      }
    }
    // Lying on the floor looking up: the ball comes back down straight at
    // the camera and fills the screen; the overlay then flies it into the logo.
    const u = clamp((x.world - SLAM_T - 0.25) / (LAND_T - SLAM_T - 0.25))
    return {
      pos: CAMERA_DOWN,
      look: x.ball(Math.max(x.world, FALL_T - 0.05)),
      fov: 70,
      roll: lerp(0.4, 0, easeOut(u)),
      frame: { ...base, lines: "vertical", flash: x.world - SLAM_T - 0.25 < 0.03 },
    }
  },
}

// ── Public API ───────────────────────────────────────────────────

type Palette = {
  ink: THREE.Color
  paper: THREE.Color
  accent: THREE.Color
  line: THREE.Color
  table: THREE.Color
  petal: THREE.Color
  css: Theme
}

/** Ball position on screen, in CSS pixels (for the match cut to the logo). */
export type BallOnScreen = { x: number; y: number; r: number; visible: boolean }

export type Intro = {
  render: (scene: number) => { frame: Frame; ball: BallOnScreen }
  resize: (width: number, height: number, dpr: number) => void
  dispose: () => void
}

export function createIntro(
  canvas: HTMLCanvasElement,
  variant: Variant,
  theme: Theme,
  cast: CharacterStyle = variant === "manga" ? "sharp" : "classic",
): Intro {
  // Built and lit in neutral colors; the post pass maps them onto the theme,
  // so the cut reads the same in light and dark theme.
  const ink = toColor(SCENE_THEME.ink)
  const paper = toColor(SCENE_THEME.paper)
  const accent = toColor(SCENE_THEME.accent)
  const palette: Palette = {
    ink,
    paper,
    accent,
    line: toColor(SCENE_THEME.line).lerp(paper, 0.2),
    table: ink.clone().lerp(paper, 0.18),
    petal: accent.clone().lerp(paper, 0.65),
    css: SCENE_THEME,
  }
  const themed = {
    ink: toColor(theme.ink),
    paper: toColor(theme.paper),
    accent: toColor(theme.accent),
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  const scene = new THREE.Scene()
  scene.background = palette.paper
  const camera = new THREE.PerspectiveCamera(50, 1, 0.03, 200)
  const kit = makeKit(ink)
  const castKit: Kit = cast === "classic" || cast === "chibi" ? kit : makeCastKit(cast, palette)
  if (castKit !== kit) kit.disposables.push(...castKit.disposables)

  scene.add(new THREE.HemisphereLight(paper, palette.line, 1.4))
  const sunLight = new THREE.DirectionalLight(paper, 2.2)
  sunLight.position.set(-3, 6, 4)
  scene.add(sunLight)

  const env =
    variant === "rooftop"
      ? buildRooftop(scene, kit, palette)
      : variant === "manga"
        ? buildClubRoom(scene, kit, palette)
        : buildGym(scene, kit, palette)
  if (env.sun) sunLight.position.copy(env.sun).normalize().multiplyScalar(10)
  enableShadows(renderer, sunLight, 4)

  scene.add(buildTable(kit, palette))
  const colors = { ink, paper, accent }
  const heroRig = makeRig(castKit, cast, "hero", colors)
  const rivalRig = makeRig(castKit, cast, "rival", colors)
  scene.add(heroRig.root, rivalRig.root)
  // Every surface takes the players' shadows (the room itself casts none),
  // except skin: no hair or paddle shadows across the faces.
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshToonMaterial && !object.userData.skin)
      object.receiveShadow = true
  })
  const hero = player(heroRig, "L")
  const rival = player(rivalRig, "R")

  const path = buildPath((side, t, squash) => (side === "L" ? hero : rival).paddleAt(t, squash))
  // Face of the blade at the smash: the ball flattens against it.
  const smashNormal = hero.contactAt(SMASH_T).normal
  const ballRadius = BALL_SIZE
  const ballMesh = inked(kit, new THREE.SphereGeometry(ballRadius, 16, 12), accent)
  scene.add(ballMesh)
  // Motion trail.
  const trail = Array.from({ length: 10 }, (_, i) => {
    const material = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.35 * (1 - i / 10) })
    kit.disposables.push(material)
    const mesh = new THREE.Mesh(ballMesh.geometry, material)
    mesh.scale.setScalar(1 - i / 14)
    scene.add(mesh)
    return mesh
  })

  const post = createPost(renderer, themed)
  const tmp = new THREE.Vector3()
  const direct = directors[variant]
  let width = 1
  let height = 1

  const render = (sceneTime: number) => {
    const world = worldAt(sceneTime)
    hero.pose(world)
    rival.pose(world)
    env.update?.(world)
    ballAt(path, world, ballMesh.position)
    // Squash and stretch: flattened against the paddle on the smash, so it
    // reads as pushed (world time is frozen at SMASH_T during the freeze).
    const squash = SQUASH * clamp(1 - Math.abs(world - SMASH_T) / 0.03)
    if (squash > 0) {
      ballMesh.quaternion.setFromUnitVectors(UP, smashNormal)
      ballMesh.scale.set(1 + squash * 0.55, 1 - squash, 1 + squash * 0.55)
    } else {
      ballMesh.quaternion.identity()
      ballMesh.scale.setScalar(1)
    }
    trail.forEach((mesh, i) => {
      const gap = world > SMASH_T ? 0.012 : 0.016
      ballAt(path, Math.max(world - (i + 1) * gap, HITS[0].t), mesh.position)
      // No trail in the freeze, nor when the ball falls at the camera.
      mesh.visible = (sceneTime < CUT.impact || sceneTime >= CUT.slam) && world < FALL_T
    })

    const shot = direct({
      scene: sceneTime,
      world,
      smashNormal,
      ball: (t) => ballAt(path, t, new THREE.Vector3()),
      hero: () => hero.headAt(),
      rival: () => rival.headAt(),
    })
    // Hide a player's head when the camera is inside it (first-person shots).
    hero.head.visible = shot.pos.distanceTo(hero.headAt()) > 0.25
    rival.head.visible = shot.pos.distanceTo(rival.headAt()) > 0.25

    camera.position.copy(shot.pos)
    camera.fov = shot.fov
    camera.updateProjectionMatrix()
    camera.up.set(0, 1, 0)
    camera.lookAt(tmp.copy(shot.look))
    camera.rotateZ(shot.roll)
    camera.updateMatrixWorld()

    post.render(scene, camera, { manga: variant === "manga", invert: shot.frame.invert })

    // Project the ball and its radius to the screen.
    const center = ballMesh.position.clone().project(camera)
    const edge = ballMesh.position
      .clone()
      .add(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(ballRadius))
      .project(camera)
    const ball: BallOnScreen = {
      x: ((center.x + 1) / 2) * width,
      y: ((1 - center.y) / 2) * height,
      r: Math.abs(edge.x - center.x) * width * 0.5,
      visible: center.z < 1 && Math.abs(center.x) < 1.2 && Math.abs(center.y) < 1.2,
    }
    return { frame: shot.frame, ball }
  }

  const resize = (w: number, h: number, dpr: number) => {
    width = w
    height = h
    const ratio = Math.min(dpr, 2)
    renderer.setPixelRatio(ratio)
    renderer.setSize(w, h, false)
    post.resize(w, h, ratio)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  const dispose = () => {
    for (const item of kit.disposables) item.dispose()
    post.dispose()
    renderer.dispose()
  }

  return { render, resize, dispose }
}
