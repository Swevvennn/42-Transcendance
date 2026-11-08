import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { PageHeader } from "@/components/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { leaderboard } from "@/lib/mock-data"
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

export default async function LeaderboardPage({
  params,
}: PageProps<"/[locale]/leaderboard">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Leaderboard")
  const tProfile = await getTranslations("Profile")

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<p className="text-xs text-muted-foreground">{tProfile("mockNotice")}</p>}
      />

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
          {leaderboard.map((row, index) => (
            <TableRow key={row.username}>
              <TableCell
                className={cn(
                  "text-2xl font-black tracking-tighter tabular-nums",
                  index === 0 && "text-primary",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </TableCell>
              <TableCell className="text-base font-semibold">{row.username}</TableCell>
              <TableCell className="text-end tabular-nums">{row.level}</TableCell>
              <TableCell className="text-end tabular-nums">{row.wins}</TableCell>
              <TableCell className="text-end tabular-nums">{row.losses}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
