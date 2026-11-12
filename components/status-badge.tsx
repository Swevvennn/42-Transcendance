import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import type { UserStatus } from "@/lib/presence"

const variants = {
  online: "default",
  inGame: "secondary",
  offline: "outline",
} as const

export function StatusBadge({ status }: { status: UserStatus }) {
  const t = useTranslations("Profile")
  return <Badge variant={variants[status]}>{t(status)}</Badge>
}
