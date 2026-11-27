import { useTranslations } from "next-intl"

import { ButtonLink } from "@/components/button-link"

export default function NotFound() {
  const t = useTranslations("NotFound")

  return (
    <div className="grid gap-8 py-8 sm:grid-cols-12 sm:items-end">
      <p
        className="text-[8rem] leading-[0.8] font-black tracking-tighter sm:col-span-7 sm:text-[14rem]"
        aria-hidden
      >
        404<span className="text-primary">.</span>
      </p>
      <div className="flex flex-col items-start gap-4 border-t-2 border-foreground pt-4 sm:col-span-5">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
        <ButtonLink href="/" size="lg" className="h-11 px-5 text-sm font-semibold">
          {t("back")}
        </ButtonLink>
      </div>
    </div>
  )
}
