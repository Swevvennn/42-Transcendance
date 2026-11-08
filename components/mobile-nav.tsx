"use client"

import { ListIcon, XIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { ButtonLink } from "@/components/button-link"
import { Button } from "@/components/ui/button"
import { usePathname } from "@/i18n/navigation"

const PANEL_ID = "mobile-nav-panel"
const LINK_CLASS = "h-11 w-full justify-start text-base font-semibold"

// Menu button and panel for small screens. The panel takes a full row of the
// header's flex-wrap container, so it pushes the page down instead of covering it.
export function MobileNav() {
  const t = useTranslations("Nav")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)

  // Close on navigation, including links outside the panel such as the logo.
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  const close = () => setOpen(false)
  const label = open ? t("closeMenu") : t("openMenu")

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(!open)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={PANEL_ID}
      >
        {open ? <XIcon aria-hidden /> : <ListIcon aria-hidden />}
      </Button>

      <nav
        id={PANEL_ID}
        aria-label={t("menu")}
        hidden={!open}
        className="basis-full flex-col gap-1 border-t border-border pt-2 data-[open=true]:flex md:hidden!"
        data-open={open}
      >
        <ButtonLink href="/play" variant="ghost" className={LINK_CLASS} onClick={close}>
          {t("play")}
        </ButtonLink>
        <ButtonLink href="/leaderboard" variant="ghost" className={LINK_CLASS} onClick={close}>
          {t("leaderboard")}
        </ButtonLink>
        <ButtonLink href="/profile" variant="ghost" className={LINK_CLASS} onClick={close}>
          {t("profile")}
        </ButtonLink>
        <ButtonLink href="/login" variant="ghost" className={LINK_CLASS} onClick={close}>
          {t("login")}
        </ButtonLink>
        <ButtonLink href="/signup" className={LINK_CLASS} onClick={close}>
          {t("signup")}
        </ButtonLink>
      </nav>
    </>
  )
}
