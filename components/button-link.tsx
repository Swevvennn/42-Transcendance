import type { VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

// A locale-aware link styled like a shadcn Button. `cn` is required so that
// conflicting classes (e.g. border colors) are merged like in <Button>.
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
