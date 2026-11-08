import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server"

import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { currentUser, friends, matchHistory } from "@/lib/mock-data"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: "Profile" })
  return { title: t("title") }
}

export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/profile">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("Profile")
  const format = await getFormatter()

  const user = currentUser
  const total = user.wins + user.losses
  const winRate = total === 0 ? 0 : user.wins / total

  const stats = [
    { key: "wins", value: format.number(user.wins) },
    { key: "losses", value: format.number(user.losses) },
    { key: "winRate", value: format.number(winRate, { style: "percent" }) },
  ] as const

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={t("title")}
        dot={false}
        title={
          <span className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Avatar size="lg" className="size-14 sm:size-16">
              <AvatarFallback className="bg-foreground text-lg font-bold text-background">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>
              {user.username}
              <span className="text-primary">.</span>
            </span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={user.status} />
            <Badge variant="outline">{t("level", { level: user.level })}</Badge>
            <span className="text-xs">{t("mockNotice")}</span>
          </span>
        }
        actions={
          <Button variant="outline" size="lg" className="h-10 px-4" disabled>
            {t("edit")}
          </Button>
        }
      />

      <section className="grid gap-8 sm:grid-cols-12">
        <h2 className="text-sm font-semibold sm:col-span-3">{t("stats.title")}</h2>
        <dl className="grid grid-cols-3 gap-6 sm:col-span-9">
          {stats.map(({ key, value }) => (
            <div key={key} className="flex flex-col-reverse gap-1 border-t border-foreground pt-3">
              <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {t(`stats.${key}`)}
              </dt>
              <dd
                className={
                  key === "winRate"
                    ? "text-4xl font-black tracking-tighter text-primary tabular-nums sm:text-6xl"
                    : "text-4xl font-black tracking-tighter tabular-nums sm:text-6xl"
                }
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-10 border-t-2 border-foreground pt-8 md:grid-cols-12">
        <section className="flex flex-col gap-4 md:col-span-8">
          <h2 className="text-2xl font-bold tracking-tight">{t("history.title")}</h2>
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="border-b-2 border-foreground hover:bg-transparent">
                <TableHead className="text-xs tracking-widest uppercase">{t("history.opponent")}</TableHead>
                <TableHead className="text-xs tracking-widest uppercase">{t("history.score")}</TableHead>
                <TableHead className="text-xs tracking-widest uppercase">{t("history.result")}</TableHead>
                <TableHead className="text-end text-xs tracking-widest uppercase">{t("history.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchHistory.map((match) => {
                const won = match.myScore > match.theirScore
                return (
                  <TableRow key={match.id}>
                    <TableCell className="font-semibold">{match.opponent}</TableCell>
                    <TableCell className="tabular-nums">
                      {match.myScore} – {match.theirScore}
                    </TableCell>
                    <TableCell>
                      <Badge variant={won ? "default" : "outline"}>
                        {won ? t("history.win") : t("history.loss")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground">
                      {format.dateTime(new Date(match.date), { dateStyle: "medium" })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </section>

        <section className="flex flex-col gap-4 md:col-span-4">
          <h2 className="text-2xl font-bold tracking-tight">{t("friends.title")}</h2>
          <ul className="flex flex-col">
            {friends.map((friend) => (
              <li
                key={friend.username}
                className="flex items-center gap-3 border-b border-border py-3"
              >
                <Avatar size="sm">
                  <AvatarFallback className="font-semibold">
                    {friend.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-semibold">{friend.username}</span>
                <StatusBadge status={friend.status} />
              </li>
            ))}
          </ul>
          <Button variant="outline" size="lg" className="h-10" disabled>
            {t("friends.add")}
          </Button>
        </section>
      </div>
    </div>
  )
}
