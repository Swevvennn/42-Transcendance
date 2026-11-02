import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"

export function SiteHeader() {
  const t = useTranslations("Nav")

  return (
    <header>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-wide">
          TRANSCENDENCE
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          <ButtonLink href="/play" variant="ghost">
            {t("play")}
          </ButtonLink>
          <ButtonLink href="/leaderboard" variant="ghost">
            {t("leaderboard")}
          </ButtonLink>
          <ButtonLink href="/profile" variant="ghost">
            {t("profile")}
          </ButtonLink>
          <ButtonLink href="/login" variant="outline">
            {t("login")}
          </ButtonLink>
          <ButtonLink href="/signup">{t("signup")}</ButtonLink>
          <LocaleSwitcher />
        </nav>
      </div>
      <Separator />
    </header>
  )
}
