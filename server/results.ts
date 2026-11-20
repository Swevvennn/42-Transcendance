import { prisma } from "@/lib/prisma"
import { levelFor, XP_LOSS, XP_WIN } from "@/lib/xp"
import type { Match } from "@/server/match"

/** A match shorter than this, with no point scored, gives no XP. */
const MIN_XP_DURATION_MS = 30_000

/**
 * Two accounts could farm XP with instant 0-0 forfeits: XP only for a match
 * where a point was scored or that lasted a while.
 */
function givesXp(match: Match, endedAt: Date) {
  const points = match.score.left + match.score.right
  return points > 0 || endedAt.getTime() - match.createdAt.getTime() >= MIN_XP_DURATION_MS
}

/**
 * Saves a finished online match (history, stats, leaderboard) and gives the
 * XP. One transaction: either everything is written or nothing.
 */
export async function saveMatchResult(match: Match) {
  if (!match.winner) return
  const { left, right } = match.players
  const winner = match.players[match.winner]
  const loser = winner.id === left.id ? right : left
  const endedAt = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.match.create({
      data: {
        player1Id: left.id,
        player2Id: right.id,
        score1: match.score.left,
        score2: match.score.right,
        winnerId: winner.id,
        forfeit: match.endReason === "forfeit",
        tournament: match.tournamentId !== null,
        startedAt: match.createdAt,
        endedAt,
      },
    })
    if (!givesXp(match, endedAt)) return
    for (const [id, xp] of [
      [winner.id, XP_WIN],
      [loser.id, XP_LOSS],
    ] as const) {
      const user = await tx.user.update({
        where: { id },
        data: { xp: { increment: xp } },
        select: { xp: true },
      })
      await tx.user.update({ where: { id }, data: { level: levelFor(user.xp) } })
    }
  })
}
