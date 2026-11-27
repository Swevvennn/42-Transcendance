// Animation variants for the landing page (previewed in /templates/motion/*).
export const landingMotions = ["gym", "rooftop", "manga", "anime", "kinetic", "rally", "assemble", "attract"] as const

export type LandingMotion = (typeof landingMotions)[number]

/** Cel-shaded 3D anime intros (components/landing/anime3d). */
export const anime3dMotions = ["gym", "rooftop", "manga"] as const
export type Anime3DMotion = (typeof anime3dMotions)[number]

export function isAnime3D(value: string | undefined): value is Anime3DMotion {
  return (anime3dMotions as readonly (string | undefined)[]).includes(value)
}

/** Variants with an anime intro overlay (2D or 3D). */
export function isAnime(value: string | undefined) {
  return value === "anime" || isAnime3D(value)
}

export function isLandingMotion(value: string): value is LandingMotion {
  return (landingMotions as readonly string[]).includes(value)
}
