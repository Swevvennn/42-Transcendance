import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { userStatus } from "@/lib/presence"

// Database reads for the profile, friends and leaderboard pages (server only).

const publicUser = {
  id: true,
  name: true,
  username: true,
  displayUsername: true,
  image: true,
  level: true,
  xp: true,
  createdAt: true,
} as const

type UserRow = { name: string; username: string | null; displayUsername: string | null }

/** The name shown everywhere: the username with the case the player typed. */
export const displayName = (user: UserRow) =>
  user.displayUsername ?? user.username ?? user.name

/** The logged-in user of this request, or null. */
export async function currentSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function findProfile(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: publicUser,
  })
}

export async function findProfileById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: publicUser })
}

const playedBy = (userId: string) => ({
  OR: [{ player1Id: userId }, { player2Id: userId }],
})

export async function getStats(userId: string) {
  const [played, wins] = await Promise.all([
    prisma.match.count({ where: playedBy(userId) }),
    prisma.match.count({ where: { winnerId: userId } }),
  ])
  return { wins, losses: played - wins, played }
}

/** The last matches of a player, seen from their side. */
export async function getHistory(userId: string, take = 20) {
  const opponentFields = { select: { name: true, username: true, displayUsername: true } }
  const matches = await prisma.match.findMany({
    where: playedBy(userId),
    orderBy: { startedAt: "desc" },
    take,
    include: { player1: opponentFields, player2: opponentFields },
  })
  return matches.map((m) => {
    const isPlayer1 = m.player1Id === userId
    const opponent = isPlayer1 ? m.player2 : m.player1
    return {
      id: m.id,
      opponent: opponent ? displayName(opponent) : null,
      opponentUsername: opponent?.username ?? null,
      myScore: isPlayer1 ? m.score1 : m.score2,
      theirScore: isPlayer1 ? m.score2 : m.score1,
      won: m.winnerId === userId,
      forfeit: m.forfeit,
      tournament: m.tournament,
      date: m.endedAt ?? m.startedAt,
    }
  })
}

/** Players ranked by wins (then fewer losses, then level). */
export async function getLeaderboard(take = 50) {
  const users = await prisma.user.findMany({
    select: {
      ...publicUser,
      _count: { select: { matchesWon: true, matchesAsPlayer1: true, matchesAsPlayer2: true } },
    },
  })
  return users
    .map(({ _count, ...user }) => {
      const played = _count.matchesAsPlayer1 + _count.matchesAsPlayer2
      return { ...user, wins: _count.matchesWon, losses: played - _count.matchesWon, played }
    })
    .filter((user) => user.played > 0)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || b.level - a.level)
    .slice(0, take)
}

export type FriendshipState = "none" | "friends" | "sent" | "received"

/** Where `me` stands with `other` (for the button on a profile). */
export async function friendshipState(me: string, other: string) {
  const f = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me, addresseeId: other },
        { requesterId: other, addresseeId: me },
      ],
    },
  })
  if (!f) return { state: "none" as FriendshipState, id: null }
  if (f.status === "accepted") return { state: "friends" as FriendshipState, id: f.id }
  return { state: (f.requesterId === me ? "sent" : "received") as FriendshipState, id: f.id }
}

/** Friends (with their live status) and pending requests of a player. */
export async function getFriends(userId: string) {
  const fields = { select: publicUser }
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: { requester: fields, addressee: fields },
    orderBy: { createdAt: "desc" },
  })
  const view = (row: (typeof rows)[number]) => {
    const other = row.requesterId === userId ? row.addressee : row.requester
    return {
      friendshipId: row.id,
      name: displayName(other),
      username: other.username,
      image: other.image,
      status: userStatus(other.id),
    }
  }
  return {
    friends: rows.filter((r) => r.status === "accepted").map(view),
    received: rows
      .filter((r) => r.status === "pending" && r.addresseeId === userId)
      .map(view),
    sent: rows.filter((r) => r.status === "pending" && r.requesterId === userId).map(view),
  }
}
