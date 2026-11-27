import * as THREE from "three"

import { inked, type Colors, type Kit } from "./kit"

// School boy characters for the anime scenes, in several model styles (the
// "character lab" in /templates lets you compare them). Every style builds
// the same skeleton, so the same poses and animation drive all of them.
// The boy faces +x; his right side is +z.

export const characterStyles = ["classic", "sharp", "lowpoly", "chibi", "ink"] as const
export type CharacterStyle = (typeof characterStyles)[number]
export type Role = "hero" | "rival"

/** Paddle blade size, in meters. */
export const BLADE_RADIUS = 0.085
export const BLADE_THICKNESS = 0.028

// ── Swings ───────────────────────────────────────────────────────

/**
 * Paddle arm: forward raise, sideways raise, elbow bend, torso twist, and
 * `face`: the blade's turn around the forearm (0: face sideways, π/2: face
 * towards the swing) and `wrist`: extra wrist bend. On the smash both turn
 * the blade square to the ball's flight, so it pushes the ball flat instead
 * of slicing it.
 */
export type Swing = { fwd: number; side: number; elbow: number; twist: number; face: number; wrist: number }
export type Stroke = "drive" | "lob" | "smash" | "whiff"

export const REST: Swing = { fwd: 0.5, side: -0.45, elbow: 1.1, twist: 0, face: 0, wrist: 0 }

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

const mix = (a: Swing, b: Swing, k: number): Swing => ({
  fwd: lerp(a.fwd, b.fwd, k),
  side: lerp(a.side, b.side, k),
  elbow: lerp(a.elbow, b.elbow, k),
  twist: lerp(a.twist, b.twist, k),
  face: lerp(a.face, b.face, k),
  wrist: lerp(a.wrist, b.wrist, k),
})

/** Smash blade turn and wrist bend at contact (see swingPose). */
const FACE = 1.46
const WRIST = 0

/** Arm pose for a stroke, `d` seconds from the moment of contact. */
export function swingPose(kind: Stroke, d: number): Swing {
  const smash = kind === "smash"
  // Smash: a longer follow-through, so the blade keeps driving after the ball
  // but slower than it (the ball leaves at ~16 m/s); a quick one would catch
  // up with the ball and go through it.
  const through = smash ? 0.4 : 0.18
  if (d < -0.5 || d > through + 0.4) return REST
  // Smash, side-arm: the arm comes from behind on the right, extended out to
  // the side and a little raised, and drives forward and down through the
  // ball. Wrist and blade turn (`face`, `wrist`) put the blade square to the
  // ball's flight at contact (solved numerically for the contact pose).
  const back: Swing = smash
    ? { fwd: -0.9, side: -2.0, elbow: 1.3, twist: -0.8, face: FACE, wrist: WRIST }
    : { fwd: -0.5, side: -0.9, elbow: 0.6, twist: -0.7, face: 0, wrist: 0 }
  const contact: Swing = smash
    ? { fwd: 0, side: -2.1, elbow: 0.15, twist: 0.1, face: FACE, wrist: WRIST }
    : kind === "lob"
      ? { fwd: 0.9, side: -0.5, elbow: 0.4, twist: 0, face: 0, wrist: 0 }
      : { fwd: 1.25, side: -0.45, elbow: 0.5, twist: 0.1, face: 0, wrist: 0 }
  const follow: Swing = smash
    ? { fwd: 1.6, side: -0.7, elbow: 0.8, twist: 0.8, face: FACE, wrist: WRIST * 0.7 }
    : { fwd: 2.0, side: 0.35, elbow: 1.4, twist: 0.7, face: 0, wrist: 0 }
  const windup = smash ? 0.45 : 0.32
  if (d < -windup) return REST
  if (d < -0.1) return mix(REST, back, easeOut((d + windup) / (windup - 0.1)))
  if (d < 0) return mix(back, contact, easeIn((d + 0.1) / 0.1))
  if (d < through) return mix(contact, follow, easeOut(d / through))
  return mix(follow, REST, easeInOut(clamp((d - through) / 0.4)))
}

// ── Expressions ──────────────────────────────────────────────────

/** Facial expression, every field 0..1. */
export type Mood = {
  /** Brows down, slanted and drawn together. */
  anger: number
  /** Eyes narrowed. */
  squint: number
  /** Eyes wide open with small pupils, brows up. */
  wide: number
  /** Mouth open (a shout, or a gasp), teeth showing. */
  shout: number
  /** A sweat drop on the temple. */
  sweat: number
}

export const CALM: Mood = { anger: 0, squint: 0, wide: 0, shout: 0, sweat: 0 }

const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a))

/**
 * The hero's face around his smash, `d` seconds from contact (world time):
 * wide-eyed and sweating as the lob goes up, then brows down and eyes
 * narrowed in the wind-up, a shout with gritted teeth on contact (held
 * through the freeze), and it eases off as the ball flies away.
 */
export function heroMood(d: number): Mood {
  const lob = ramp(d, -0.6, -0.45) * (1 - ramp(d, -0.24, -0.14))
  const fury = ramp(d, -0.3, -0.08) * (1 - 0.5 * ramp(d, 0.3, 0.6))
  return {
    anger: Math.max(0.35, fury),
    squint: ramp(d, -0.14, -0.04) * (1 - ramp(d, 0.2, 0.4)),
    wide: lob,
    shout: ramp(d, -0.06, 0) * (1 - ramp(d, 0.15, 0.45)),
    sweat: ramp(d, -0.55, -0.4) * (1 - ramp(d, -0.1, 0)),
  }
}

/** The rival as the smash goes past him: stunned, eyes wide, mouth open. */
export function rivalMood(d: number): Mood {
  const shock = ramp(d, 0.02, 0.14)
  return { anger: 0, squint: 0, wide: shock, shout: shock * 0.45, sweat: shock }
}

export type PoseParams = {
  t: number
  swing: Swing
  /** Jump height in meters. */
  lift: number
  /** 0..1: lean back and look up. */
  look: number
  /** 0..1: extra forward whip of the torso on the smash. */
  whip: number
  bob: number
  mood?: Mood
}

// ── Proportions ──────────────────────────────────────────────────

type Body = {
  thigh: number
  shin: number
  legR: number
  /** Lathe profile of the torso, [radius, height] from the waist up. */
  torso: [number, number][]
  torsoScale: [number, number]
  shoulderY: number
  shoulderW: number
  upper: number
  fore: number
  armR: number
  neckY: number
  headR: number
}

const SHARP: Body = {
  thigh: 0.5,
  shin: 0.5,
  legR: 0.058,
  torso: [[0, -0.04], [0.11, -0.02], [0.12, 0.08], [0.15, 0.28], [0.18, 0.42], [0.11, 0.5], [0, 0.51]],
  torsoScale: [0.62, 1.25],
  shoulderY: 0.45,
  shoulderW: 0.2,
  upper: 0.29,
  fore: 0.27,
  armR: 0.042,
  neckY: 0.53,
  headR: 0.1,
}

const BODIES: Record<CharacterStyle, Body> = {
  classic: {
    thigh: 0.44,
    shin: 0.42,
    legR: 0.07,
    torso: [[0, -0.05], [0.12, -0.03], [0.15, 0.1], [0.16, 0.3], [0.14, 0.45], [0.08, 0.52], [0, 0.53]],
    torsoScale: [0.78, 1.2],
    shoulderY: 0.5,
    shoulderW: 0.2,
    upper: 0.29,
    fore: 0.27,
    armR: 0.052,
    neckY: 0.58,
    headR: 0.115,
  },
  sharp: SHARP,
  lowpoly: SHARP,
  chibi: {
    thigh: 0.2,
    shin: 0.18,
    legR: 0.065,
    torso: [[0, -0.03], [0.12, 0], [0.135, 0.12], [0.12, 0.22], [0, 0.24]],
    torsoScale: [0.85, 1.1],
    shoulderY: 0.2,
    shoulderW: 0.14,
    upper: 0.13,
    fore: 0.12,
    armR: 0.05,
    neckY: 0.24,
    headR: 0.2,
  },
  ink: { ...SHARP, thigh: 0.55, shin: 0.55, legR: 0.054 },
}

// ── Builders ─────────────────────────────────────────────────────

/** Deterministic pseudo-random in [0, 1) (no Math.random: same model every time). */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const UP = new THREE.Vector3(0, 1, 0)

type Hair = { count: number; len: [number, number]; radius: number; sweep: number; front: number; seed: number }

function hair(kit: Kit, head: THREE.Group, center: THREE.Vector3, r: number, color: THREE.Color, h: Hair, seg: number) {
  const cap = inked(
    kit,
    new THREE.SphereGeometry(r * 1.05, seg * 2, seg, 0, Math.PI * 2, 0, Math.PI * 0.56),
    color,
  )
  cap.position.copy(center).add(new THREE.Vector3(-r * 0.06, r * 0.05, 0))
  cap.rotation.z = 0.4
  head.add(cap)
  for (let i = 0; i < h.count; i++) {
    // Spread over the top and back of the head, never over the face.
    const theta = lerp(0.1, 1.7, rnd(i, h.seed))
    const phi = lerp(h.front, Math.PI * 2 - h.front, rnd(i, h.seed + 1))
    const n = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi))
    const length = lerp(h.len[0], h.len[1], rnd(i, h.seed + 2))
    const geometry = new THREE.ConeGeometry(h.radius * lerp(0.7, 1.2, rnd(i, h.seed + 3)), length, Math.max(4, seg))
    geometry.translate(0, length / 2, 0)
    const spike = inked(kit, geometry, color)
    spike.position.copy(center).addScaledVector(n, r * 0.8)
    const dir = n.clone().add(new THREE.Vector3(-h.sweep, 0.15, 0)).normalize()
    spike.quaternion.setFromUnitVectors(UP, dir)
    head.add(spike)
  }
}

export type Rig = {
  root: THREE.Group
  /** Hidden when the camera is inside it (first-person shots). */
  head: THREE.Group
  skull: THREE.Object3D
  /** Center of the paddle blade, where the ball is hit. */
  sweet: THREE.Object3D
  apply: (p: PoseParams) => void
}

export function makeRig(kit: Kit, style: CharacterStyle, role: Role, c: Colors): Rig {
  const B = BODIES[style]
  const hero = role === "hero"
  const ink = style === "ink"
  const seg = kit.flat ? 3 : 8
  // Sharp manga builds: hexagonal tapered limbs, diamond joints, boxy hands.
  const angular = style === "sharp" || style === "lowpoly" || style === "ink"
  const round = angular ? 6 : seg * 2
  const skin = ink ? c.ink : c.paper
  const jacket = hero || ink ? c.ink : c.paper
  const trousers = c.ink
  const detail = ink ? c.paper : c.ink
  // Light skin gets the softer skin shading (the ink style's skin is dark).
  const bare = !ink

  /** A limb hanging down from its joint; `taper` scales the [top, bottom] radius. */
  const limb = (
    length: number,
    radius: number,
    color: THREE.Color,
    taper: [number, number] = [1.1, 0.75],
    isSkin = false,
  ) => {
    const geometry = angular
      ? new THREE.CylinderGeometry(radius * taper[0], radius * taper[1], length, 6)
      : new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 2), Math.max(2, seg / 2), seg + 2)
    geometry.translate(0, -length / 2, 0)
    return inked(kit, geometry, color, true, isSkin)
  }
  /** A diamond at a knee, elbow or shoulder, so the bend reads as a clear angle. */
  const joint = (radius: number, color: THREE.Color, point = 1.25) => {
    const mesh = inked(kit, new THREE.OctahedronGeometry(radius), color)
    mesh.scale.set(point, 0.85, 1)
    return mesh
  }
  /** Unlit detail (eyes): never shaded or toned. */
  const flatDetail = (geometry: THREE.BufferGeometry, color: THREE.Color) => {
    const mesh = new THREE.Mesh(geometry, kit.basic(color))
    kit.disposables.push(geometry)
    return mesh
  }

  const root = new THREE.Group()
  const hips = new THREE.Group()
  root.add(hips)
  const pelvis = angular
    ? inked(kit, new THREE.CylinderGeometry(B.legR * 2.1, B.legR * 1.5, B.legR * 2.4, 6), trousers)
    : inked(kit, new THREE.SphereGeometry(B.legR * 2.1, seg * 2, seg), trousers)
  pelvis.scale.set(0.9, angular ? 1 : 0.75, 1.2)
  hips.add(pelvis)

  // Legs: thigh → knee → shin → shoe.
  const legs = ([1, -1] as const).map((s) => {
    const thigh = new THREE.Group()
    thigh.position.set(0, -0.02, B.legR * 1.4 * s)
    thigh.add(limb(B.thigh, B.legR, trousers, [1.2, 0.8]))
    const knee = new THREE.Group()
    knee.position.y = -B.thigh
    knee.add(limb(B.shin, B.legR * 0.85, trousers, [1.05, 0.6]))
    if (angular) knee.add(joint(B.legR * 0.95, trousers, 1.35))
    const shoe = inked(kit, new THREE.BoxGeometry(B.legR * 4, B.legR * 1.2, B.legR * 1.8), ink ? c.ink : c.paper, false)
    shoe.position.set(B.legR * 0.9, -B.shin, 0)
    knee.add(shoe)
    thigh.add(knee)
    hips.add(thigh)
    return { thigh, knee }
  })

  if (hero && style !== "chibi") {
    // Gakuran coat tails, flaring over the hips.
    const tails = new THREE.Mesh(
      new THREE.CylinderGeometry(B.torso[1][0] * 1.05, B.torso[1][0] * 1.35, B.thigh * 0.38, round, 1, true),
      kit.toon(c.ink),
    )
    kit.disposables.push(tails.geometry)
    ;(tails.material as THREE.MeshToonMaterial).side = THREE.DoubleSide
    tails.scale.set(B.torsoScale[0] * 1.2, 1, B.torsoScale[1])
    tails.position.y = -B.thigh * 0.12
    hips.add(tails)
  }

  // Torso: a lathe profile, V-shaped for the athletic styles.
  const spine = new THREE.Group()
  spine.position.y = 0.03
  hips.add(spine)
  const torso = inked(
    kit,
    new THREE.LatheGeometry(B.torso.map(([x, y]) => new THREE.Vector2(x, y)), round),
    jacket,
  )
  torso.scale.set(B.torsoScale[0], 1, B.torsoScale[1])
  spine.add(torso)
  const front = B.torso[3][0] * B.torsoScale[0]
  if (hero) {
    const collar = inked(kit, new THREE.CylinderGeometry(B.headR * 0.62, B.headR * 0.75, B.headR * 0.7, round), c.ink)
    collar.position.y = B.neckY - B.headR * 0.15
    spine.add(collar)
    for (let i = 0; i < 4; i++) {
      const button = inked(kit, new THREE.SphereGeometry(0.012, 6, 4), ink ? c.accent : c.paper, false)
      button.position.set(front + 0.004, B.shoulderY * (0.2 + i * 0.2), 0)
      spine.add(button)
    }
  } else {
    const tie = inked(kit, new THREE.BoxGeometry(0.015, B.shoulderY * 0.55, 0.045), c.accent, false)
    tie.position.set(front + 0.006, B.shoulderY * 0.62, 0)
    tie.rotation.z = -0.08
    spine.add(tie)
    const collarL = inked(kit, new THREE.BoxGeometry(0.02, 0.04, 0.09), ink ? c.ink : c.paper, false)
    collarL.position.set(front * 0.7, B.neckY - 0.03, 0)
    spine.add(collarL)
  }

  // Head.
  const neck = new THREE.Group()
  neck.position.y = B.neckY
  spine.add(neck)
  neck.add(limb(B.headR * 0.6, B.headR * 0.32, skin, [0.9, 1.1], bare).translateY(B.headR * 0.55))
  const head = new THREE.Group()
  head.position.y = B.headR * 0.4
  neck.add(head)
  const R = B.headR
  const center = new THREE.Vector3(0, R * 1.05, 0)
  const skull = inked(kit, new THREE.SphereGeometry(R, angular ? 12 : seg * 2, angular ? 8 : seg + 2), skin, true, bare)
  skull.position.copy(center)
  skull.scale.set(style === "chibi" ? 1 : 0.95, style === "chibi" ? 0.95 : 1.08, style === "chibi" ? 1.05 : 0.88)
  head.add(skull)

  // Parts of the face the expressions move (see Mood).
  const face: {
    eyes: {
      s: number
      at: THREE.Vector3
      tilt: number
      white: THREE.Mesh
      iris: THREE.Mesh
      shine: THREE.Mesh
      lash: THREE.Mesh
      brow: THREE.Mesh | null
      rest: {
        white: THREE.Vector3
        iris: THREE.Vector3
        irisAt: THREE.Vector3
        shineAt: THREE.Vector3
        lashAt: THREE.Vector3
        browAt: THREE.Vector3
        brow: number
      }
    }[]
    mouth: { mesh: THREE.Mesh; at: THREE.Vector3; teeth: { strip: THREE.Mesh; s: 1 | -1 }[] } | null
    sweat: THREE.Group | null
  } = { eyes: [], mouth: null, sweat: null }

  if (style !== "classic" && style !== "chibi") {
    // Sharp manga jaw: a pyramid pointing down and forward to the chin.
    const jawGeometry = new THREE.ConeGeometry(R * 0.72, R * 0.95, 4)
    jawGeometry.rotateY(Math.PI / 4)
    const jaw = inked(kit, jawGeometry, skin, true, bare)
    jaw.position.copy(center).add(new THREE.Vector3(R * 0.32, -R * 0.5, 0))
    jaw.rotation.z = Math.PI + 0.55
    jaw.scale.set(1, 1, 0.8)
    head.add(jaw)
    const noseGeometry = new THREE.ConeGeometry(R * 0.08, R * 0.25, 4)
    const nose = inked(kit, noseGeometry, skin, false, bare)
    nose.position.copy(center).add(new THREE.Vector3(R * 0.98, -R * 0.12, 0))
    nose.rotation.z = -Math.PI / 2 - 0.4
    head.add(nose)
    // Mouth: a thin line that opens into a shout; teeth show when open.
    const mouthAt = center.clone().add(new THREE.Vector3(R * 0.9, -R * 0.5, 0))
    const mouth = inked(kit, new THREE.BoxGeometry(R * 0.04, R * 0.04, R * 0.3), detail, false)
    mouth.position.copy(mouthAt)
    head.add(mouth)
    const teeth = ([1, -1] as const).map((s) => {
      const strip = flatDetail(new THREE.BoxGeometry(R * 0.02, R * 0.05, R * 0.26), ink ? c.ink : c.paper)
      strip.visible = false
      head.add(strip)
      return { strip, s }
    })
    face.mouth = { mesh: mouth, at: mouthAt, teeth }
  }

  // Manga eyes: white almond, big dark iris, heavy upper lash, a highlight,
  // slanted brows. Rounder and much bigger for chibi.
  const big = style === "chibi"
  const simple = style === "classic"
  for (const s of [1, -1]) {
    const at = center.clone().add(new THREE.Vector3(R * 0.86, R * (big ? -0.05 : 0.06), R * 0.4 * s))
    const tilt = big || simple ? 0 : (hero ? 0.3 : 0.2) * s
    if (simple) {
      const eye = inked(kit, new THREE.SphereGeometry(R * 0.2, seg * 2, seg), detail, false)
      eye.scale.set(0.3, 1.4, 0.6)
      eye.position.copy(at)
      head.add(eye)
      continue
    }
    const white = flatDetail(new THREE.SphereGeometry(R * 0.2, seg * 2, seg), c.paper)
    white.scale.set(0.35, big ? 1.5 : 0.75, big ? 1.1 : 1.45)
    white.position.copy(at)
    white.rotation.x = tilt
    head.add(white)
    const iris = flatDetail(new THREE.SphereGeometry(R * 0.2, seg * 2, seg), c.ink)
    iris.scale.set(0.3, big ? 1.25 : 0.72, big ? 0.85 : 0.6)
    iris.position.copy(at).add(new THREE.Vector3(R * 0.035, -R * 0.01, -R * 0.04 * s))
    head.add(iris)
    const shine = flatDetail(new THREE.SphereGeometry(R * (big ? 0.07 : 0.045), 6, 4), c.paper)
    shine.position.copy(at).add(new THREE.Vector3(R * 0.1, R * (big ? 0.1 : 0.05), -R * 0.02 * s))
    head.add(shine)
    const lash = inked(kit, new THREE.BoxGeometry(R * 0.06, R * 0.07, R * (big ? 0.5 : 0.62)), c.ink, false)
    lash.position.copy(at).add(new THREE.Vector3(R * 0.04, R * (big ? 0.3 : 0.15), R * 0.02 * s))
    lash.rotation.x = tilt * 1.3
    head.add(lash)
    let brow: THREE.Mesh | null = null
    if (!big) {
      brow = inked(kit, new THREE.BoxGeometry(R * 0.06, R * 0.07, R * 0.45), c.ink, false)
      brow.position.copy(at).add(new THREE.Vector3(R * 0.04, R * 0.33, 0))
      brow.rotation.x = (hero ? -0.4 : -0.18) * s
      head.add(brow)
    }
    face.eyes.push({
      s,
      at,
      tilt,
      white,
      iris,
      shine,
      lash,
      brow,
      rest: {
        white: white.scale.clone(),
        iris: iris.scale.clone(),
        irisAt: iris.position.clone(),
        shineAt: shine.position.clone(),
        lashAt: lash.position.clone(),
        browAt: brow?.position.clone() ?? new THREE.Vector3(),
        brow: brow?.rotation.x ?? 0,
      },
    })
  }

  // Hair: wild spikes for the hero, sleek and swept back for the rival.
  const hairColor = c.ink
  if (style === "chibi") {
    hair(kit, head, center, R, hairColor, { count: hero ? 9 : 6, len: [R * 0.5, R * 0.9], radius: R * 0.3, sweep: hero ? 0.6 : 1.4, front: 0.9, seed: hero ? 3 : 7 }, seg)
  } else if (style === "classic") {
    hair(kit, head, center, R, hairColor, { count: hero ? 11 : 6, len: [R * 0.9, R * 1.7], radius: R * 0.38, sweep: hero ? 0.8 : 1.5, front: 1.1, seed: hero ? 3 : 7 }, seg)
  } else {
    hair(kit, head, center, R, hairColor, hero
      ? { count: 22, len: [R * 1.2, R * 2.6], radius: R * 0.3, sweep: 0.9, front: 0.9, seed: 3 }
      : { count: 16, len: [R * 0.9, R * 1.7], radius: R * 0.28, sweep: 1.8, front: 0.8, seed: 7 }, seg)
  }
  // Bangs over the forehead (and long side locks for the rival).
  const bangs = hero ? [-0.5, 0, 0.5] : [-0.85, -0.45, 0.45, 0.85]
  for (const z of bangs) {
    // Short over the eyes, long on the sides (the rival's locks frame his face).
    const side = Math.abs(z) > 0.6
    const length = R * (side ? 1.5 : 0.45)
    const geometry = new THREE.ConeGeometry(R * 0.2, length, Math.max(4, seg))
    geometry.translate(0, -length / 2, 0)
    const bang = inked(kit, geometry, hairColor, false)
    bang.position.copy(center).add(new THREE.Vector3(R * (side ? 0.25 : 0.68), R * 0.82, R * z * (side ? 1.12 : 1)))
    bang.rotation.z = side ? 0.12 : 0.5
    bang.rotation.x = z * (side ? 0.12 : 0.35)
    head.add(bang)
  }

  let band: THREE.Group | null = null
  if (hero) {
    // Red headband and two tails that flutter.
    const ring = inked(kit, new THREE.TorusGeometry(R * 1.02, R * 0.12, 6, seg * 3), c.accent, false)
    ring.rotation.x = Math.PI / 2
    ring.rotation.y = 0.3
    ring.position.copy(center).add(new THREE.Vector3(0, R * 0.38, 0))
    head.add(ring)
    band = new THREE.Group()
    band.position.copy(center).add(new THREE.Vector3(-R, R * 0.3, 0))
    for (const s of [1, -1]) {
      const tail = inked(kit, new THREE.BoxGeometry(R * 2.2, R * 0.25, 0.005), c.accent, false)
      tail.geometry.translate(-R * 1.1, 0, 0)
      tail.position.z = 0.012 * s
      band.add(tail)
    }
    head.add(band)
  } else {
    // Glasses: sharp rectangles, round for chibi.
    for (const s of [1, -1]) {
      const eyePos = center.clone().add(new THREE.Vector3(R * 1.0, R * 0.06, R * 0.4 * s))
      if (style === "chibi") {
        const lens = inked(kit, new THREE.TorusGeometry(R * 0.32, R * 0.04, 6, 16), detail, false)
        lens.rotation.y = Math.PI / 2
        lens.position.copy(eyePos).add(new THREE.Vector3(0.01, 0, 0))
        head.add(lens)
      } else {
        for (const [w, hgt, dy, dz] of [
          [R * 0.62, R * 0.05, R * 0.17, 0],
          [R * 0.62, R * 0.05, -R * 0.17, 0],
          [R * 0.05, R * 0.38, 0, R * 0.3],
          [R * 0.05, R * 0.38, 0, -R * 0.3],
        ]) {
          const bar = inked(kit, new THREE.BoxGeometry(R * 0.04, hgt, w), detail, false)
          bar.position.copy(eyePos).add(new THREE.Vector3(0, dy, dz))
          head.add(bar)
        }
      }
    }
  }

  if (style !== "classic") {
    // Sweat drop on the temple (on the camera side in the smash shots): a
    // white teardrop with an ink outline.
    const drop = new THREE.Group()
    const bulb = inked(kit, new THREE.SphereGeometry(R * 0.11, 10, 8), c.paper)
    const tip = inked(kit, new THREE.ConeGeometry(R * 0.105, R * 0.22, 10), c.paper)
    tip.position.y = R * 0.11
    drop.add(bulb, tip)
    drop.position.copy(center).add(new THREE.Vector3(R * 0.45, R * 0.35, R * 0.98))
    drop.visible = false
    head.add(drop)
    face.sweat = drop
  }

  // Arms: shoulder → elbow → hand. The right hand holds the paddle.
  const arms = ([1, -1] as const).map((s) => {
    const shoulder = new THREE.Group()
    shoulder.position.set(0, B.shoulderY, B.shoulderW * s)
    shoulder.add(limb(B.upper, B.armR, jacket, [1.25, 0.8]))
    const elbow = new THREE.Group()
    elbow.position.y = -B.upper
    const sleeve = hero || ink ? jacket : skin
    elbow.add(limb(B.fore, B.armR * 0.88, sleeve, [1.05, 0.65], bare && sleeve === skin))
    if (angular) {
      // Squared shoulder pad and a pointed elbow.
      const pad = joint(B.armR * 1.45, jacket, 1.1)
      pad.position.y = -B.armR * 0.3
      shoulder.add(pad)
      elbow.add(joint(B.armR * 0.9, sleeve, 1.3))
    }
    const hand = angular
      ? inked(kit, new THREE.BoxGeometry(B.armR * 1.5, B.armR * 2, B.armR * 1.3), skin, true, bare)
      : inked(kit, new THREE.SphereGeometry(B.armR * 0.95, seg, seg), skin, true, bare)
    hand.position.y = -B.fore - (angular ? B.armR * 0.5 : 0)
    elbow.add(hand)
    shoulder.add(elbow)
    spine.add(shoulder)
    return { shoulder, elbow }
  })
  const paddle = new THREE.Group()
  paddle.position.y = -B.fore - 0.03
  const handle = inked(kit, new THREE.CylinderGeometry(0.014, 0.014, 0.1, 8), c.ink, false)
  handle.position.y = -0.04
  paddle.add(handle)
  // Thicker than a real blade (stylized): the smash shots see it edge-on, and
  // a real 12 mm blade then shrinks to a hairline and vanishes.
  const blade = inked(kit, new THREE.CylinderGeometry(BLADE_RADIUS, BLADE_RADIUS, BLADE_THICKNESS, seg * 3), c.accent)
  // Rubbers like a real paddle: black on the hitting face (+y cap, the one
  // that meets the ball on the smash), red on the back. The edge is red too,
  // so the blade still reads in profile against the black gakuran.
  ;(blade as THREE.Mesh).material = [kit.toon(c.accent), kit.toon(c.ink), kit.toon(c.accent)]
  blade.rotation.x = Math.PI / 2
  blade.position.y = -0.14
  paddle.add(blade)
  const sweet = new THREE.Object3D()
  blade.add(sweet)
  arms[0].elbow.add(paddle)

  const expression = (m: Mood, t: number) => {
    for (const e of face.eyes) {
      const { rest, s } = e
      // Eyelids: open wider with `wide`, narrow to a slit with `squint`.
      const open = clamp(1 + 0.3 * m.wide - 0.62 * m.squint, 0.3, 1.4)
      e.white.scale.set(rest.white.x, rest.white.y * open, rest.white.z)
      // Pupils shrink when wide-eyed (shock, focus); squinting hides them.
      const pupil = 1 - 0.35 * m.wide
      e.iris.scale.set(rest.iris.x, rest.iris.y * Math.min(open, 1) * pupil, rest.iris.z * pupil)
      e.shine.visible = m.squint < 0.6
      // Upper lash rides the lid down; anger slants it towards the nose.
      e.lash.position.y = rest.lashAt.y - (1 - open) * R * 0.14
      e.lash.rotation.x = e.tilt * 1.3 + 0.35 * m.anger * s
      if (e.brow) {
        // Brows: down, steeper and drawn together with anger, up when wide.
        e.brow.position.set(
          rest.browAt.x,
          rest.browAt.y - R * 0.1 * m.anger + R * 0.1 * m.wide,
          rest.browAt.z - s * R * 0.08 * m.anger,
        )
        e.brow.rotation.x = rest.brow - (0.4 * m.anger - 0.3 * m.wide) * s
      }
    }
    if (face.mouth) {
      // Open mouth: taller, a bit wider, dropping with the jaw.
      const { mesh, at, teeth } = face.mouth
      const o = m.shout
      mesh.scale.set(1, 1 + 6 * o, 1 + 0.5 * o)
      mesh.position.set(at.x, at.y - R * 0.1 * o, at.z)
      for (const { strip, s } of teeth) {
        strip.visible = o > 0.25
        strip.scale.set(1, 1, 1 + 0.4 * o)
        // Upper and lower teeth, a dark gap between them.
        strip.position.set(at.x + R * 0.012, at.y - R * 0.1 * o + s * R * 0.08 * o, at.z)
      }
    }
    if (face.sweat) {
      face.sweat.visible = m.sweat > 0.05
      face.sweat.scale.setScalar(Math.max(0.01, m.sweat))
      face.sweat.position.y = center.y + R * 0.35 - R * 0.25 * ((t * 0.8) % 1) * m.sweat
    }
  }

  const apply = (p: PoseParams) => {
    // Knees bent in a ready stance, tucked while jumping; the hips sit at the
    // height that keeps the feet on the floor.
    const crouch = 0.35 + clamp(p.lift * 3) * 0.6
    const hipY = (B.thigh * Math.cos(crouch) + B.shin * Math.cos(crouch * 0.6)) * Math.cos(0.22) + B.legR * 0.6
    hips.position.y = hipY + p.bob + p.lift * 0.05
    root.position.y = p.lift
    for (const [i, leg] of legs.entries()) {
      leg.thigh.rotation.z = crouch + (i ? -0.15 : 0.15)
      leg.thigh.rotation.x = i ? 0.22 : -0.22
      leg.knee.rotation.z = -crouch * 1.6
    }
    spine.rotation.z = -0.32 + p.look * 0.45 - p.whip * 0.25
    spine.rotation.y = p.swing.twist * 0.6
    neck.rotation.z = 0.25 + p.look * 0.5
    neck.rotation.y = -p.swing.twist * 0.4
    const [right, left] = arms
    right.shoulder.rotation.z = p.swing.fwd
    right.shoulder.rotation.x = p.swing.side
    right.elbow.rotation.z = p.swing.elbow
    left.shoulder.rotation.z = 0.7 - p.swing.twist * 0.6
    left.shoulder.rotation.x = 0.45
    left.elbow.rotation.z = 1.3
    paddle.rotation.x = -0.4 + p.swing.wrist
    paddle.rotation.y = p.swing.face
    expression(p.mood ?? CALM, p.t)
    if (band) band.rotation.set(Math.sin(p.t * 19) * 0.3, Math.sin(p.t * 13) * 0.4, -0.3 + Math.sin(p.t * 23) * 0.15)
    root.updateMatrixWorld(true)
  }

  return { root, head, skull, sweet, apply }
}
