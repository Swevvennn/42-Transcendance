import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { PageHeader } from "@/components/page-header"
import { UserAvatar } from "@/components/profile/user-avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link } from "@/i18n/navigation"
import { displayName, getLeaderboard } from "@/lib/users"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/leaderboard">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Leaderboard",
  })
  return { title: t("title") }
}

// Read from the database on every request (results change after each match).
export const dynamic = "force-dynamic"

export default async function LeaderboardPage({
  params,
}: PageProps<"/[locale]/leaderboard">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Leaderboard")
  const rows = await getLeaderboard()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-b-2 border-foreground hover:bg-transparent">
              <TableHead className="w-20 text-xs tracking-widest uppercase">{t("rank")}</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">{t("player")}</TableHead>
              <TableHead className="text-end text-xs tracking-widest uppercase">{t("level")}</TableHead>
              <TableHead className="text-end text-xs tracking-widest uppercase">{t("wins")}</TableHead>
              <TableHead className="text-end text-xs tracking-widest uppercase">{t("losses")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell
                  className={cn(
                    "text-2xl font-black tracking-tighter tabular-nums",
                    index === 0 && "text-primary",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/profile/${row.username}`}
                    className="flex items-center gap-2 text-base font-semibold hover:underline"
                  >
                    <UserAvatar name={displayName(row)} image={row.image} size="sm" />
                    {displayName(row)}
                  </Link>
                </TableCell>
                <TableCell className="text-end tabular-nums">{row.level}</TableCell>
                <TableCell className="text-end tabular-nums">{row.wins}</TableCell>
                <TableCell className="text-end tabular-nums">{row.losses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
