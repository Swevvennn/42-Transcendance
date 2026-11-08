import { useTranslations } from "next-intl"

import { logos } from "@/components/brand/logos"
import { ButtonLink } from "@/components/button-link"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Link } from "@/i18n/navigation"

export function SiteHeader() {
  const t = useTranslations("Nav")
  const tMeta = useTranslations("Metadata")

  return (
    <header className="border-b-2 border-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-1 gap-y-2 px-4 py-3 md:gap-x-6">
        <Link
          href="/"
          dir="ltr"
          className="flex items-center gap-2 text-base font-bold tracking-tight"
        >
          {/* The site logo is the Stack block (also the favicon, app/icon.svg). */}
          <span aria-hidden>
            <logos.stack.Icon name={tMeta("title")} size={22} className="text-foreground" />
          </span>
          {tMeta("title")}
        </Link>

        <nav aria-label={t("menu")} className="ms-auto hidden items-center gap-1 md:flex">
          <ButtonLink href="/play" variant="ghost" className="text-sm font-semibold">
            {t("play")}
          </ButtonLink>
          <ButtonLink href="/leaderboard" variant="ghost" className="text-sm font-semibold">
            {t("leaderboard")}
          </ButtonLink>
          <ButtonLink href="/profile" variant="ghost" className="text-sm font-semibold">
            {t("profile")}
          </ButtonLink>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <ButtonLink href="/login" variant="ghost" className="text-sm font-semibold">
            {t("login")}
          </ButtonLink>
          <ButtonLink href="/signup" className="text-sm font-semibold">
            {t("signup")}
          </ButtonLink>
        </nav>

        {/* Stays visible at every width; the page links collapse into MobileNav. */}
        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <span className="mx-1 hidden h-5 w-px bg-border md:block" aria-hidden />
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <MobileNav />
      </div>
    </header>
  )
}
