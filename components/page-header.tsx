import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

// Swiss page heading: small label, big tight title, thick rule underneath.
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  dot = true,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Red period after the title; turn off when the title isn't plain text. */
  dot?: boolean
  className?: string
}) {
  return (
    <header
      className={cn(
        "grid gap-4 border-b-2 border-foreground pb-6 sm:grid-cols-12 sm:items-end",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:col-span-8">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-5xl leading-[0.9] font-bold tracking-tighter sm:text-7xl">
          {title}
          {dot && <span className="text-primary">.</span>}
        </h1>
        {description && (
          <p className="max-w-xl text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 sm:col-span-4 sm:justify-end">{actions}</div>
      )}
    </header>
  )
}
