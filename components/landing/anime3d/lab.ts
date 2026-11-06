import * as THREE from "three"

import { createPost, enableShadows, makeKit, SCENE_THEME, toColor, type Kit, type Theme } from "./kit"
import { CALM, heroMood, makeRig, swingPose, REST, type CharacterStyle, type Mood, type PoseParams, type Swing } from "./rig"

// Turntable preview of one character style: the hero and the rival side by
// side, posed (ready stance, looping forehand or jump smash), optionally in
// the manga screentone. Used by the character lab in /templates.

export type LabPose = "ready" | "swing" | "smash"
export type LabView = "body" | "face"

export type Lab = {
  render: (t: number, options: { pose: LabPose; view: LabView; manga: boolean; spin: number }) => void
  resize: (width: number, height: number, dpr: number) => void
  dispose: () => void
}

function params(pose: LabPose, t: number, offset: number): PoseParams {
  const time = t + offset
  let swing: Swing = REST
  let lift = 0
  let whip = 0
  let mood: Mood = CALM
  if (pose === "swing") {
    swing = swingPose("drive", (time % 1.6) - 0.8)
  } else if (pose === "smash") {
    const d = (time % 2.2) - 1.1
    swing = swingPose("smash", d)
    lift = Math.max(0, 1 - ((d + 0.03) / 0.4) ** 2) * 0.55
    whip = Math.max(0, 1 - Math.abs(d) / 0.3)
    mood = heroMood(d)
  }
  return { t: time, swing, lift, whip, look: 0, bob: Math.sin(time * 9) * 0.015, mood }
}

/** The kit a character style is drawn with. */
export function makeCastKit(style: CharacterStyle, c: { ink: THREE.Color; paper: THREE.Color }): Kit {
  if (style === "lowpoly") return makeKit(c.ink, { flat: true })
  if (style === "ink") return makeKit(c.paper, { thickness: 0.007, facets: true })
  return makeKit(c.ink, { facets: style === "sharp" })
}

export function createLab(canvas: HTMLCanvasElement, style: CharacterStyle, theme: Theme): Lab {
  // Built and lit in neutral colors; the post pass maps them onto the theme.
  const ink = toColor(SCENE_THEME.ink)
  const paper = toColor(SCENE_THEME.paper)
  const accent = toColor(SCENE_THEME.accent)
  const line = toColor(SCENE_THEME.line)
  const colors = { ink, paper, accent }
  const themed = { ink: toColor(theme.ink), paper: toColor(theme.paper), accent: toColor(theme.accent) }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  const scene = new THREE.Scene()
  scene.background = paper
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50)

  scene.add(new THREE.HemisphereLight(paper, line, 1.4))
  const sun = new THREE.DirectionalLight(paper, 2.2)
  // Raking light from the side: half of each body falls into shadow.
  sun.position.set(-4, 5, 2.5)
  scene.add(sun)
  enableShadows(renderer, sun, 1.6)

  const kit = makeCastKit(style, colors)

  const turntable = new THREE.Group()
  scene.add(turntable)
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), kit.toon(line))
  kit.disposables.push(ground.geometry)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  turntable.add(ground)

  const hero = makeRig(kit, style, "hero", colors)
  const rival = makeRig(kit, style, "rival", colors)
  // Three-quarter views, facing the camera.
  const place = (root: THREE.Group, x: number, turn: number) => {
    const holder = new THREE.Group()
    holder.position.x = x
    holder.rotation.y = -Math.PI / 2 + turn
    holder.add(root)
    turntable.add(holder)
  }
  place(hero.root, -0.42, 0.3)
  place(rival.root, 0.42, -0.3)

  const post = createPost(renderer, themed)

  return {
    render: (t, options) => {
      turntable.rotation.y = options.spin
      hero.apply(params(options.pose, t, 0))
      rival.apply(params(options.pose, t, 0.45))
      if (options.view === "face") {
        // Close-up on the faces, at the height of the heads.
        const y = hero.skull.getWorldPosition(new THREE.Vector3()).y
        camera.position.set(0, y + 0.04, 1.7)
        camera.lookAt(0, y - 0.02, 0)
      } else {
        camera.position.set(0, 1.25, 5)
        camera.lookAt(0, 1.05, 0)
      }
      post.render(scene, camera, { manga: options.manga, invert: false })
    },
    resize: (width, height, dpr) => {
      const ratio = Math.min(dpr, 2)
      renderer.setPixelRatio(ratio)
      renderer.setSize(width, height, false)
      post.resize(width, height, ratio)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    },
    dispose: () => {
      for (const item of kit.disposables) item.dispose()
      post.dispose()
      renderer.dispose()
    },
  }
}
