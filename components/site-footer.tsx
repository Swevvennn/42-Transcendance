import { useTranslations } from "next-intl"

import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"

export function SiteFooter() {
  const t = useTranslations("Footer")

  return (
    <footer>
      <Separator />
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
        <p>{t("rights")}</p>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:underline">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:underline">
            {t("terms")}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
