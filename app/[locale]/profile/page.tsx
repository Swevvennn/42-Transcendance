import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server"

import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-muted-foreground">{t("mockNotice")}</p>

      <section className="flex flex-wrap items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <div className="flex gap-2">
            <StatusBadge status={user.status} />
            <Badge variant="outline">{t("level", { level: user.level })}</Badge>
          </div>
        </div>
        <Button variant="outline" className="ml-auto" disabled>
          {t("edit")}
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("stats.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{user.wins}</p>
            <p className="text-xs text-muted-foreground">{t("stats.wins")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{user.losses}</p>
            <p className="text-xs text-muted-foreground">{t("stats.losses")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {format.number(winRate, { style: "percent" })}
            </p>
            <p className="text-xs text-muted-foreground">{t("stats.winRate")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("history.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("history.opponent")}</TableHead>
                  <TableHead>{t("history.score")}</TableHead>
                  <TableHead>{t("history.result")}</TableHead>
                  <TableHead>{t("history.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchHistory.map((match) => {
                  const won = match.myScore > match.theirScore
                  return (
                    <TableRow key={match.id}>
                      <TableCell>{match.opponent}</TableCell>
                      <TableCell>
                        {match.myScore} - {match.theirScore}
                      </TableCell>
                      <TableCell>
                        <Badge variant={won ? "default" : "destructive"}>
                          {won ? t("history.win") : t("history.loss")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format.dateTime(new Date(match.date), { dateStyle: "medium" })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("friends.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {friends.map((friend) => (
              <div key={friend.username} className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarFallback>
                    {friend.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm">{friend.username}</span>
                <StatusBadge status={friend.status} />
              </div>
            ))}
            <Button variant="outline" disabled>
              {t("friends.add")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
