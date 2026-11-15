import { prisma } from "@/lib/prisma"
import { levelFor, XP_LOSS, XP_WIN } from "@/lib/xp"
import type { Match } from "@/server/match"

/**
 * Saves a finished online match (history, stats, leaderboard) and gives the
 * XP. One transaction: either everything is written or nothing.
 */
export async function saveMatchResult(match: Match) {
  if (!match.winner) return
  const { left, right } = match.players
  const winner = match.players[match.winner]
  const loser = winner.id === left.id ? right : left

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
        endedAt: new Date(),
      },
    })
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
