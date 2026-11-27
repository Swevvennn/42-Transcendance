// Light/dark theme. The choice is kept in localStorage; without one we follow
// the OS preference. `themeScript` runs in <head> before the first paint
// (see node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).

export type Theme = "light" | "dark"

export const THEME_STORAGE_KEY = "theme"

// Must stay self-contained: it is inlined as a string.
function applyStoredTheme(key: string) {
  try {
    const stored = localStorage.getItem(key)
    const dark = stored
      ? stored === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches
    document.documentElement.classList.toggle("dark", dark)
  } catch {}
}

export const themeScript = `(${applyStoredTheme.toString()})(${JSON.stringify(THEME_STORAGE_KEY)})`

export function reapplyStoredTheme() {
  applyStoredTheme(THEME_STORAGE_KEY)
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {}
}
