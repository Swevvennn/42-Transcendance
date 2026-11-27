import { ArrowLeftIcon } from "@phosphor-icons/react/ssr"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { templateFonts, type TemplateStyle } from "@/components/templates/registry"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

// Full-screen wrapper for a style-lab landing page. It covers the site header
// and footer so each experiment can own the whole viewport, and re-adds the
// legal links (required on every page).
export function TemplateShell({
  style,
  children,
}: {
  style: TemplateStyle
  children: ReactNode
}) {
  const t = useTranslations("Templates")
  const tFooter = useTranslations("Footer")

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-background text-foreground",
        `theme-${style}`,
        templateFonts[style],
      )}
    >
      <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-2 text-xs backdrop-blur">
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden />
          {t("back")}
        </Link>
        <LocaleSwitcher />
      </div>

      {children}

      <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <p>{tFooter("rights")}</p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:underline">
              {tFooter("privacy")}
            </Link>
            <Link href="/terms" className="hover:underline">
              {tFooter("terms")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
