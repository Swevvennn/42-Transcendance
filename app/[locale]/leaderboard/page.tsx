import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { leaderboard } from "@/lib/mock-data"

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

export default async function LeaderboardPage({
  params,
}: PageProps<"/[locale]/leaderboard">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Leaderboard")
  const tProfile = await getTranslations("Profile")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
        <p className="text-xs text-muted-foreground">{tProfile("mockNotice")}</p>
      </div>

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
          {leaderboard.map((row, index) => (
            <TableRow key={row.username}>
              <TableCell>#{index + 1}</TableCell>
              <TableCell>{row.username}</TableCell>
              <TableCell>{row.level}</TableCell>
              <TableCell>{row.wins}</TableCell>
              <TableCell>{row.losses}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
