import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("rank")}</TableHead>
              <TableHead>{t("player")}</TableHead>
              <TableHead>{t("level")}</TableHead>
              <TableHead>{t("wins")}</TableHead>
              <TableHead>{t("losses")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>#{index + 1}</TableCell>
                <TableCell>
                  <Link href={`/profile/${row.username}`} className="flex items-center gap-2 hover:underline">
                    <UserAvatar name={displayName(row)} image={row.image} size="sm" />
                    {displayName(row)}
                  </Link>
                </TableCell>
                <TableCell>{row.level}</TableCell>
                <TableCell>{row.wins}</TableCell>
                <TableCell>{row.losses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
