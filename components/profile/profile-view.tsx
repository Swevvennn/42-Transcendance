import { getFormatter, getTranslations } from "next-intl/server"

import { ButtonLink } from "@/components/button-link"
import { PageHeader } from "@/components/page-header"
import { FriendButton } from "@/components/profile/friend-button"
import { FriendsPanel } from "@/components/profile/friends-panel"
import { UserAvatar } from "@/components/profile/user-avatar"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
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

  const statItems = [
    { key: "played", value: format.number(stats.played) },
    { key: "wins", value: format.number(stats.wins) },
    { key: "losses", value: format.number(stats.losses) },
    { key: "winRate", value: format.number(winRate, { style: "percent" }) },
  ] as const

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={t("title")}
        dot={false}
        title={
          <span className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <UserAvatar name={name} image={user.image} className="size-14 text-lg sm:size-16" />
            <span>
              {name}
              <span className="text-primary">.</span>
            </span>
          </span>
        }
        description={
          <span className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center gap-2">
              {/* Online status: only for yourself and your friends. */}
              {(isOwn || friendship?.state === "friends") && (
                <StatusBadge status={userStatus(user.id)} />
              )}
              <Badge variant="outline">{t("level", { level: user.level })}</Badge>
              <Badge variant="outline">{t("xp", { xp: user.xp })}</Badge>
            </span>
            <span className="text-xs">
              {t("memberSince", { date: format.dateTime(user.createdAt, { dateStyle: "medium" }) })}
            </span>
          </span>
        }
        actions={
          <>
            {isOwn && (
              <ButtonLink href="/settings" variant="outline" size="lg" className="h-10 px-4">
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
          </>
        }
      />

      <section className="grid gap-8 sm:grid-cols-12">
        <h2 className="text-sm font-semibold sm:col-span-3">{t("stats.title")}</h2>
        <dl className="grid grid-cols-2 gap-6 sm:col-span-9 sm:grid-cols-4">
          {statItems.map(({ key, value }) => (
            <div key={key} className="flex flex-col-reverse gap-1 border-t border-foreground pt-3">
              <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {t(`stats.${key}`)}
              </dt>
              <dd
                className={
                  key === "winRate"
                    ? "text-4xl font-black tracking-tighter text-primary tabular-nums sm:text-5xl"
                    : "text-4xl font-black tracking-tighter tabular-nums sm:text-5xl"
                }
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-10 border-t-2 border-foreground pt-8 md:grid-cols-12">
        <section className={isOwn ? "flex flex-col gap-4 md:col-span-8" : "flex flex-col gap-4 md:col-span-12"}>
          <h2 className="text-2xl font-bold tracking-tight">{t("history.title")}</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
          ) : (
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
                {history.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-semibold">
                      {match.opponentUsername ? (
                        <Link href={`/profile/${match.opponentUsername}`} className="hover:underline">
                          {match.opponent}
                        </Link>
                      ) : (
                        t("history.deleted")
                      )}
                      {match.tournament && (
                        <Badge variant="outline" className="ms-2">
                          {t("history.tournament")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {match.myScore} – {match.theirScore}
                      {match.forfeit && (
                        <span className="ms-1 text-xs text-muted-foreground">
                          ({t("history.forfeit")})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={match.won ? "default" : "outline"}>
                        {match.won ? t("history.win") : t("history.loss")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground">
                      {format.dateTime(match.date, { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {friends && (
          <section className="flex flex-col gap-4 md:col-span-4">
            <h2 className="text-2xl font-bold tracking-tight">{t("friends.title")}</h2>
            <FriendsPanel {...friends} />
          </section>
        )}
      </div>
    </div>
  )
}
