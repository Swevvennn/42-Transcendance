import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

// Swiss block: thick rule on top, title on the left, content on the right
// (stacked on small screens). Replaces the cards of the other pages.
export function SwissSection({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn("grid gap-4 border-t-2 border-foreground pt-4 md:grid-cols-12 md:gap-8", className)}
    >
      <div className="flex flex-col gap-1 md:col-span-4">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0 md:col-span-8">{children}</div>
    </section>
  )
}
