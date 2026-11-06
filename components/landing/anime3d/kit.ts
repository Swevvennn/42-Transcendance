import * as THREE from "three"
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js"

// Shared three.js helpers for the anime scenes: theme colors, cel-shaded
// materials with ink outlines, and the post-processing pass (screentone,
// impact inversion).

export type Theme = { ink: string; paper: string; accent: string; line: string }

export type Colors = { ink: THREE.Color; paper: THREE.Color; accent: THREE.Color }

/**
 * The scene is always lit and rendered in these neutral colors; the post pass
 * then maps the result onto the real theme (paper → background, ink →
 * foreground). That way shading means the same thing in light and dark theme:
 * shadows get screentone, and in dark theme the tone is light-on-dark.
 */
export const SCENE_THEME: Theme = { ink: "#111111", paper: "#ffffff", accent: "#e01e1e", line: "#e4e4e4" }

/** Converts any CSS color (oklch included) to a three.js color via a 1px canvas. */
export function toColor(css: string) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return new THREE.Color(0x000000)
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
}

const OUTLINE_VERTEX = /* glsl */ `
  uniform float thickness;
  void main() {
    vec3 p = position + normal * thickness;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const OUTLINE_FRAGMENT = /* glsl */ `
  uniform vec3 color;
  void main() {
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

export type Kit = {
  toon: (color: THREE.Color) => THREE.MeshToonMaterial
  /**
   * Material for skin. With facets it is lifted towards white so a face in
   * shadow only gets a light screentone instead of turning dark.
   */
  skin: (color: THREE.Color) => THREE.MeshToonMaterial
  /** Unlit material, for eyes and other details that must not get shadows. */
  basic: (color: THREE.Color) => THREE.MeshBasicMaterial
  outline: THREE.ShaderMaterial
  /** Faceted low-poly look: flat shading, no outlines, fewer segments. */
  flat: boolean
  /** Hard two-band shading on flat faces: shadows with straight edges. */
  facets: boolean
  disposables: { dispose: () => void }[]
}

/** How much a faceted kit lifts skin in shadow (emissive share of its color). */
const SKIN_LIFT = 0.42

export function makeKit(
  outlineColor: THREE.Color,
  options: { flat?: boolean; facets?: boolean; thickness?: number } = {},
): Kit {
  const flat = options.flat ?? false
  const facets = options.facets ?? false
  const disposables: { dispose: () => void }[] = []
  // Hard light bands: the cel-shading look. With facets, only lit or in
  // shadow, decided per face, so the shadows are triangles and quads.
  const bands = facets ? [0, 255] : [90, 180, 255]
  const gradient = new THREE.DataTexture(new Uint8Array(bands), bands.length, 1, THREE.RedFormat)
  gradient.minFilter = THREE.NearestFilter
  gradient.magFilter = THREE.NearestFilter
  gradient.needsUpdate = true
  disposables.push(gradient)
  const cache = new Map<string, THREE.MeshToonMaterial>()
  const toon = (color: THREE.Color) => {
    const key = color.getHexString()
    let material = cache.get(key)
    if (!material) {
      material = new THREE.MeshToonMaterial({ color, gradientMap: gradient })
      // Not in the toon typings, but its shader honours it (per-face normals).
      Object.assign(material, { flatShading: facets })
      cache.set(key, material)
      disposables.push(material)
    }
    return material
  }
  const skins = new Map<string, THREE.MeshToonMaterial>()
  const skin = (color: THREE.Color) => {
    if (!facets) return toon(color)
    const key = color.getHexString()
    let material = skins.get(key)
    if (!material) {
      material = new THREE.MeshToonMaterial({
        color,
        gradientMap: gradient,
        emissive: color.clone().multiplyScalar(SKIN_LIFT),
      })
      Object.assign(material, { flatShading: facets })
      skins.set(key, material)
      disposables.push(material)
    }
    return material
  }
  const unlit = new Map<string, THREE.MeshBasicMaterial>()
  const basic = (color: THREE.Color) => {
    const key = color.getHexString()
    let material = unlit.get(key)
    if (!material) {
      material = new THREE.MeshBasicMaterial({ color })
      unlit.set(key, material)
      disposables.push(material)
    }
    return material
  }
  const outline = new THREE.ShaderMaterial({
    uniforms: { thickness: { value: options.thickness ?? 0.012 }, color: { value: outlineColor } },
    vertexShader: OUTLINE_VERTEX,
    fragmentShader: OUTLINE_FRAGMENT,
    side: THREE.BackSide,
  })
  disposables.push(outline)
  return { toon, skin, basic, outline, flat, facets, disposables }
}

/**
 * A cel-shaded mesh with its ink outline (inverted hull). Skin meshes use the
 * skin material and receive no cast shadows (hair and bangs would otherwise
 * throw dark blotches across the face).
 */
export function inked(kit: Kit, source: THREE.BufferGeometry, color: THREE.Color, outline = true, skin = false) {
  let geometry = source
  if (kit.flat) {
    // Faceted: split the vertices so every triangle gets its own normal.
    geometry = source.index ? source.toNonIndexed() : source
    geometry.computeVertexNormals()
    if (geometry !== source) source.dispose()
  }
  const mesh = new THREE.Mesh(geometry, skin ? kit.skin(color) : kit.toon(color))
  mesh.castShadow = true
  mesh.receiveShadow = !skin
  if (skin) mesh.userData.skin = true
  kit.disposables.push(geometry)
  if (outline && !kit.flat) {
    const hull = new THREE.Mesh(hullOf(geometry), kit.outline)
    if (hull.geometry !== geometry) kit.disposables.push(hull.geometry)
    mesh.add(hull)
  }
  return mesh
}

/**
 * The outline is the mesh pushed out along its normals. Hard-edged shapes
 * (boxes, prisms) have split normals at their corners, which would crack
 * the outline open, so the hull gets merged, averaged normals.
 */
function hullOf(geometry: THREE.BufferGeometry) {
  if (geometry.type === "SphereGeometry" || geometry.type === "CapsuleGeometry") return geometry
  const bare = new THREE.BufferGeometry()
  bare.setAttribute("position", geometry.getAttribute("position"))
  if (geometry.index) bare.setIndex(geometry.index)
  const merged = mergeVertices(bare, 1e-4)
  merged.computeVertexNormals()
  return merged
}

/** Hard-edged sun shadows, cast and received by every inked mesh. */
export function enableShadows(renderer: THREE.WebGLRenderer, sun: THREE.DirectionalLight, extent: number) {
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.015
  const cam = sun.shadow.camera
  cam.left = cam.bottom = -extent
  cam.right = cam.top = extent
  cam.near = 0.5
  cam.far = 40
  cam.updateProjectionMatrix()
}

// ── Post-processing ──────────────────────────────────────────────

const POST_FRAGMENT = /* glsl */ `
  uniform sampler2D tScene;
  uniform vec3 ink; uniform vec3 paper; uniform vec3 accent;
  uniform float invert; uniform float manga; uniform float dotSize;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tScene, vUv).rgb;
    float red = step(0.12, c.r - max(c.g, c.b));
    // The scene is rendered in neutral black and white (SCENE_THEME).
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    if (manga > 0.5 && red < 0.5) {
      // Rotated halftone grid: dot size follows darkness.
      vec2 p = mat2(0.707, -0.707, 0.707, 0.707) * gl_FragCoord.xy / dotSize;
      float d = length(fract(p) - 0.5);
      float tone = step(d, sqrt(clamp(1.0 - l * 1.25, 0.0, 1.0)) * 0.62);
      c = l > 0.7 ? paper : (l < 0.06 ? ink : mix(paper, ink, tone));
    } else if (manga > 0.5) {
      c = accent;
    } else if (red < 0.5) {
      // Plain cel shading: grays become the theme's duotone.
      c = mix(ink, paper, clamp(l * 1.1, 0.0, 1.0));
    } else {
      // Shaded red, rebuilt from the theme accent.
      c = accent * clamp(c.r * 1.25, 0.0, 1.0);
    }
    if (invert > 0.5 && red < 0.5) c = ink + paper - c;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`

export type Post = {
  render: (scene: THREE.Scene, camera: THREE.Camera, options: { manga: boolean; invert: boolean }) => void
  resize: (width: number, height: number, ratio: number) => void
  dispose: () => void
}

/** Renders the scene to a texture, then through the screentone/invert shader. */
export function createPost(renderer: THREE.WebGLRenderer, colors: Colors): Post {
  const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4 })
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: target.texture },
      ink: { value: colors.ink },
      paper: { value: colors.paper },
      accent: { value: colors.accent },
      invert: { value: 0 },
      manga: { value: 0 },
      dotSize: { value: 5 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: POST_FRAGMENT,
    depthTest: false,
    depthWrite: false,
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  const scene = new THREE.Scene()
  scene.add(quad)
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  return {
    render: (world, view, options) => {
      material.uniforms.manga.value = options.manga ? 1 : 0
      material.uniforms.invert.value = options.invert ? 1 : 0
      renderer.setRenderTarget(target)
      renderer.render(world, view)
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
    },
    resize: (width, height, ratio) => {
      target.setSize(Math.max(1, Math.round(width * ratio)), Math.max(1, Math.round(height * ratio)))
      material.uniforms.dotSize.value = 4 * ratio
    },
    dispose: () => {
      quad.geometry.dispose()
      material.dispose()
      target.dispose()
    },
  }
}
