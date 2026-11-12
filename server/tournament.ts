import type {
  BracketMatch,
  ErrorCode,
  PlayerRef,
  TournamentInfo,
  TournamentStatus,
  TournamentSummary,
} from "@/lib/pong/protocol"

// A single-elimination tournament. This class only manages the bracket: it
// does not create the games itself. The game server asks `pendingMatches()`
// which games can start, creates them, and reports results with `reportResult`.

export const MIN_PLAYERS = 3

type Result = { ok: true } | { ok: false; error: ErrorCode }

export class Tournament {
  status: TournamentStatus = "lobby"
  players: PlayerRef[] = []
  rounds: BracketMatch[][] = []
  winner: PlayerRef | null = null
  hostId: string

  constructor(
    readonly id: string,
    readonly name: string,
    readonly maxPlayers: number,
    host: PlayerRef
  ) {
    this.hostId = host.id
    this.players.push(host)
  }

  info(): TournamentInfo {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      maxPlayers: this.maxPlayers,
      status: this.status,
      players: this.players,
      rounds: this.rounds,
      winner: this.winner,
    }
  }

  summary(): TournamentSummary {
    return {
      id: this.id,
      name: this.name,
      maxPlayers: this.maxPlayers,
      status: this.status,
      playerCount: this.players.length,
      hostName: this.players.find((p) => p.id === this.hostId)?.name ?? "",
    }
  }

  has(playerId: string) {
    return this.players.some((p) => p.id === playerId)
  }

  /** True if the player still has games to play in this tournament. */
  isStillIn(playerId: string) {
    if (this.status !== "running") return false
    return !this.rounds.flat().some(
      (m) => m.winnerId && m.winnerId !== playerId && m.players.some((p) => p?.id === playerId)
    )
  }

  join(player: PlayerRef): Result {
    if (this.has(player.id)) return { ok: true }
    if (this.status !== "lobby") return { ok: false, error: "tournamentStarted" }
    if (this.players.length >= this.maxPlayers) return { ok: false, error: "tournamentFull" }
    this.players.push(player)
    return { ok: true }
  }

  leave(playerId: string): Result {
    if (this.status !== "lobby") return { ok: false, error: "tournamentStarted" }
    this.players = this.players.filter((p) => p.id !== playerId)
    // The host left: the next player becomes host.
    if (this.hostId === playerId && this.players.length > 0) {
      this.hostId = this.players[0].id
    }
    return { ok: true }
  }

  /** Builds the bracket. `shuffle` decides the seeding. */
  start(byId: string, shuffle: <T>(list: T[]) => T[]): Result {
    if (byId !== this.hostId) return { ok: false, error: "notHost" }
    if (this.status !== "lobby") return { ok: false, error: "tournamentStarted" }
    if (this.players.length < MIN_PLAYERS) return { ok: false, error: "notEnoughPlayers" }

    // Bracket size = next power of two (3 players → 4 slots, 5 → 8).
    const players = shuffle(this.players)
    let size = 2
    while (size < players.length) size *= 2
    const firstRoundGames = size / 2

    // Fill the first slot of every game, then the second ones: empty slots
    // ("byes") are spread out, so no game has two empty slots.
    const first: BracketMatch[] = Array.from({ length: firstRoundGames }, (_, i) => ({
      matchId: null,
      players: [players[i], players[firstRoundGames + i] ?? null],
      winnerId: null,
      score: null,
      bye: false,
    }))

    this.rounds = [first]
    for (let games = firstRoundGames / 2; games >= 1; games /= 2) {
      this.rounds.push(
        Array.from({ length: games }, () => ({
          matchId: null,
          players: [null, null],
          winnerId: null,
          score: null,
          bye: false,
        }))
      )
    }
    this.status = "running"

    // A player alone in a first-round game goes straight to the next round.
    first.forEach((game, index) => {
      const [a, b] = game.players
      if (a && !b) {
        game.bye = true
        this.advance(0, index, a)
      }
    })
    return { ok: true }
  }

  /** Games whose two players are known but which were not created yet. */
  pendingMatches() {
    const pending: { round: number; index: number; players: [PlayerRef, PlayerRef] }[] = []
    this.rounds.forEach((games, round) =>
      games.forEach((game, index) => {
        const [a, b] = game.players
        if (a && b && !game.matchId && !game.winnerId) {
          pending.push({ round, index, players: [a, b] })
        }
      })
    )
    return pending
  }

  setMatchId(round: number, index: number, matchId: string) {
    this.rounds[round][index].matchId = matchId
  }

  /** A game of this tournament ended: record it and move the winner up. */
  reportResult(matchId: string, winnerId: string, score: [number, number]) {
    this.rounds.forEach((games, round) =>
      games.forEach((game, index) => {
        if (game.matchId !== matchId || game.winnerId) return
        const winner = game.players.find((p) => p?.id === winnerId)
        if (!winner) return
        game.score = score
        this.advance(round, index, winner)
      })
    )
  }

  private advance(round: number, index: number, winner: PlayerRef) {
    this.rounds[round][index].winnerId = winner.id
    const next = this.rounds[round + 1]
    if (!next) {
      // That was the final.
      this.winner = winner
      this.status = "finished"
      return
    }
    next[Math.floor(index / 2)].players[index % 2] = winner
  }
}
