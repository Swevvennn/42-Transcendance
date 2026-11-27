import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "fr", "ar"],
  defaultLocale: "en",
})

/** Text direction of a locale, for the `dir` attribute on <html>. */
export function localeDirection(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}
