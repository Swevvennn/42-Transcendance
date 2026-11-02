import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"

export default function NotFound() {
  const t = useTranslations("NotFound")

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <ButtonLink href="/">{t("back")}</ButtonLink>
    </div>
  )
}
