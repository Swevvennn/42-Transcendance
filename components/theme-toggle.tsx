"use client"

import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useLayoutEffect } from "react"

import { Button } from "@/components/ui/button"
import { reapplyStoredTheme, setTheme } from "@/lib/theme"

// Switches between light and dark. Both icons are rendered and CSS shows the
// right one, so server and client markup are identical (no hydration mismatch).
export function ThemeToggle() {
  const t = useTranslations("Nav")

  // React's dev Strict Mode remount resets <html> attributes; re-apply the
  // theme before paint. No-op in production.
  useLayoutEffect(() => {
    reapplyStoredTheme()
  }, [])

  function toggle() {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label={t("theme")} title={t("theme")}>
      <MoonIcon className="dark:hidden" aria-hidden />
      <SunIcon className="hidden dark:block" aria-hidden />
    </Button>
  )
}
