"use client"

import { useLocale, useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"
import { usePathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher")
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <div role="group" aria-label={t("label")} className="flex">
      {routing.locales.map((l) => (
        <ButtonLink
          key={l}
          href={pathname}
          locale={l}
          aria-label={t(l)}
          aria-current={l === locale ? "true" : undefined}
          variant={l === locale ? "secondary" : "ghost"}
          size="sm"
        >
          {l.toUpperCase()}
        </ButtonLink>
      ))}
    </div>
  )
}
