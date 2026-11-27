import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"

export function SiteFooter() {
  const t = useTranslations("Footer")

  return (
    <footer className="border-t-2 border-foreground">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 text-sm sm:grid-cols-12">
        <p className="flex items-center gap-2 font-semibold sm:col-span-6">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          {t("rights")}
        </p>
        <nav className="flex gap-6 sm:col-span-6 sm:justify-end">
          <Link href="/privacy" className="font-medium underline-offset-4 hover:underline">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="font-medium underline-offset-4 hover:underline">
            {t("terms")}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
