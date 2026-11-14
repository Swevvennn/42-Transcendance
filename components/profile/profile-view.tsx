import { getFormatter, getTranslations } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
import { FriendButton } from "@/components/profile/friend-button"
import { FriendsPanel } from "@/components/profile/friends-panel"
import { UserAvatar } from "@/components/profile/user-avatar"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link } from "@/i18n/navigation"
import { userStatus } from "@/lib/presence"
import {
  displayName,
  findProfileById,
  friendshipState,
  getFriends,
  getHistory,
  getStats,
} from "@/lib/users"

type Profile = NonNullable<Awaited<ReturnType<typeof findProfileById>>>

/**
 * A player's profile: stats, history, and (on your own profile) friends.
 * `viewerId` is the logged-in user, or null for a visitor.
 */
export async function ProfileView({
  user,
  viewerId,
}: {
  user: Profile
  viewerId: string | null
}) {
  const t = await getTranslations("Profile")
  const format = await getFormatter()
  const isOwn = viewerId === user.id
  const name = displayName(user)

  const [stats, history, friendship, friends] = await Promise.all([
    getStats(user.id),
    getHistory(user.id),
    viewerId && !isOwn ? friendshipState(viewerId, user.id) : null,
    isOwn ? getFriends(user.id) : null,
  ])
  const winRate = stats.played === 0 ? 0 : stats.wins / stats.played

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-4">
        <UserAvatar name={name} image={user.image} className="size-20 text-xl" />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{name}</h1>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={userStatus(user.id)} />
            <Badge variant="outline">{t("level", { level: user.level })}</Badge>
            <Badge variant="outline">{t("xp", { xp: user.xp })}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("memberSince", { date: format.dateTime(user.createdAt, { dateStyle: "medium" }) })}
          </p>
        </div>
        <div className="ml-auto">
          {isOwn && (
            <ButtonLink href="/settings" variant="outline">
              {t("settings")}
            </ButtonLink>
          )}
          {friendship && user.username && (
            <FriendButton
              username={user.username}
              state={friendship.state}
              friendshipId={friendship.id}
            />
          )}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("stats.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          {[
            [stats.played, t("stats.played")],
            [stats.wins, t("stats.wins")],
            [stats.losses, t("stats.losses")],
            [format.number(winRate, { style: "percent" }), t("stats.winRate")],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className={isOwn ? "md:col-span-2" : "md:col-span-3"}>
          <CardHeader>
            <CardTitle>{t("history.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
            ) : (
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
                  {history.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        {match.opponentUsername ? (
                          <Link href={`/profile/${match.opponentUsername}`} className="hover:underline">
                            {match.opponent}
                          </Link>
                        ) : (
                          t("history.deleted")
                        )}
                        {match.tournament && (
                          <Badge variant="outline" className="ml-2">
                            {t("history.tournament")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.myScore} - {match.theirScore}
                        {match.forfeit && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({t("history.forfeit")})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={match.won ? "default" : "destructive"}>
                          {match.won ? t("history.win") : t("history.loss")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format.dateTime(match.date, { dateStyle: "medium", timeStyle: "short" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {friends && (
          <Card>
            <CardHeader>
              <CardTitle>{t("friends.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FriendsPanel {...friends} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
