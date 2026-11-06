import {
  Archivo_Black,
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Condensed,
  Instrument_Serif,
  Inter_Tight,
  JetBrains_Mono,
  Space_Grotesk,
} from "next/font/google"

// Style lab: experimental landing pages, one per visual direction.
// `preload: false` so pages never preload a font they don't render
// (Chrome logs a console warning for unused preloads).
const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brutalist-display",
  preload: false,
})
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-brutalist",
  preload: false,
})
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-editorial",
  preload: false,
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-terminal",
  preload: false,
})
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-swiss", preload: false })
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-riso",
  preload: false,
})
const plexCondensed = IBM_Plex_Sans_Condensed({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-blueprint-display",
  preload: false,
})
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-blueprint",
  preload: false,
})

export const templateStyles = [
  "brutalist",
  "editorial",
  "terminal",
  "swiss",
  "riso",
  "blueprint",
] as const

export type TemplateStyle = (typeof templateStyles)[number]

export function isTemplateStyle(value: string): value is TemplateStyle {
  return (templateStyles as readonly string[]).includes(value)
}

// CSS font variables each style needs (see app/templates.css).
export const templateFonts: Record<TemplateStyle, string> = {
  brutalist: `${archivoBlack.variable} ${spaceGrotesk.variable}`,
  editorial: instrumentSerif.variable,
  terminal: jetbrainsMono.variable,
  swiss: interTight.variable,
  riso: bricolage.variable,
  blueprint: `${plexCondensed.variable} ${plexMono.variable}`,
}

export const allTemplateFonts = Object.values(templateFonts).join(" ")
