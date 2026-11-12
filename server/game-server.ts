import { randomBytes, randomInt } from "node:crypto"

import type { Server, Socket } from "socket.io"

import type {
  ClientToServerEvents,
  ErrorCode,
  PlayerRef,
  ServerToClientEvents,
} from "@/lib/pong/protocol"
import { auth } from "@/lib/auth"
import { setPresenceSource, type UserStatus } from "@/lib/presence"
import { directionSchema, idSchema, tournamentFormSchema } from "@/lib/validation/game"
import { Match } from "@/server/match"
import { saveMatchResult } from "@/server/results"
import { Tournament } from "@/server/tournament"

// Glue between Socket.IO and the game logic: matchmaking queue, live matches
// and tournaments. Everything is kept in memory (a restart loses the games in
// progress). Finished matches are saved in the database (server/results.ts).

type SocketData = {
  player: PlayerRef
  /** The match this socket is currently looking at, and its side if it plays. */
  watching: { matchId: string; side: "left" | "right" | null } | null
}

export type GameIO = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>

const TICK_MS = 1000 / 60
/** Finished games stay readable a while (to show the result after a reload). */
const KEEP_FINISHED_MATCH_MS = 5 * 60_000
const KEEP_FINISHED_TOURNAMENT_MS = 30 * 60_000

const newId = () => randomBytes(9).toString("base64url")

// Room names: Socket.IO sends a message to everyone in a room at once.
const rooms = {
  player: (id: string) => `player:${id}`, // all the tabs of one player
  match: (id: string) => `match:${id}`, // players + spectators of a match
  tournament: (id: string) => `tournament:${id}`,
  tournamentList: "tournaments",
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export class GameServer {
  private matches = new Map<string, Match>()
  /** playerId → id of the match they must play (not finished). */
  private activeMatch = new Map<string, string>()
  /** Players waiting for a random opponent, in arrival order. */
  private queue: PlayerRef[] = []
  private tournaments = new Map<string, Tournament>()

  constructor(private readonly io: GameIO) {
    io.use((socket, next) => this.authenticate(socket, next))
    io.on("connection", (socket) => this.onConnection(socket))
    // Lets the pages (profile, friends) show who is online / in game.
    setPresenceSource({ statusOf: (id) => this.statusOf(id) })
    setInterval(() => {
      const now = Date.now()
      for (const match of this.matches.values()) match.tick(now)
    }, TICK_MS)
  }

  // --- Connection ---------------------------------------------------------

  /** In game if they have a match to play, online if a tab is connected. */
  statusOf(playerId: string): UserStatus {
    if (this.activeMatch.has(playerId)) return "inGame"
    if (this.io.sockets.adapter.rooms.get(rooms.player(playerId))?.size) return "online"
    return "offline"
  }

  // Who is this? The browser sends its Better Auth session cookie with the
  // WebSocket handshake; we ask Better Auth which user it belongs to. Nothing
  // the client could forge: no cookie / bad cookie = connection refused.
  private async authenticate(socket: GameSocket, next: (err?: Error) => void) {
    try {
      const session = await auth.api.getSession({
        headers: new Headers({ cookie: socket.request.headers.cookie ?? "" }),
      })
      if (!session) return next(new Error("unauthorized"))
      const { user } = session
      socket.data.player = {
        id: user.id,
        name: user.displayUsername ?? user.username ?? user.name,
      }
      socket.data.watching = null
      next()
    } catch {
      next(new Error("unauthorized"))
    }
  }

  private onConnection(socket: GameSocket) {
    const player = socket.data.player
    socket.join(rooms.player(player.id))

    socket.on("session:get", (ack) => {
      if (typeof ack !== "function") return
      ack({ activeMatchId: this.activeMatch.get(player.id) ?? null })
    })

    // Matchmaking.
    socket.on("queue:join", (ack) => {
      if (typeof ack !== "function") return
      ack(this.joinQueue(player))
    })
    socket.on("queue:leave", () => this.leaveQueue(player.id))

    // Matches (players and spectators).
    socket.on("match:join", (rawId, ack) => {
      if (typeof ack !== "function") return
      const id = idSchema.safeParse(rawId)
      const match = id.success ? this.matches.get(id.data) : undefined
      if (!match) return ack({ ok: false, error: "notFound" })

      if (socket.data.watching?.matchId !== match.id) {
        this.stopWatching(socket)
        const side = match.sideOf(player.id)
        socket.data.watching = { matchId: match.id, side }
        socket.join(rooms.match(match.id))
        if (side) match.connect(side)
      }
      ack({
        ok: true,
        role: socket.data.watching!.side ?? "spectator",
        info: match.info(),
        serverNow: Date.now(),
      })
      socket.emit("match:frame", match.frame())
    })
    socket.on("match:leave", () => this.stopWatching(socket))
    socket.on("match:input", (raw) => {
      const direction = directionSchema.safeParse(raw)
      const watching = socket.data.watching
      if (!direction.success || !watching?.side) return
      this.matches.get(watching.matchId)?.setInput(watching.side, direction.data)
    })
    socket.on("match:forfeit", (rawId) => {
      const id = idSchema.safeParse(rawId)
      const match = id.success ? this.matches.get(id.data) : undefined
      const side = match?.sideOf(player.id)
      if (match && side) match.forfeit(side)
    })

    // Tournaments.
    socket.on("tournament:subscribeList", (ack) => {
      if (typeof ack !== "function") return
      socket.join(rooms.tournamentList)
      ack(this.tournamentList())
    })
    socket.on("tournament:unsubscribeList", () => socket.leave(rooms.tournamentList))
    socket.on("tournament:create", (raw, ack) => {
      if (typeof ack !== "function") return
      const input = tournamentFormSchema.safeParse(raw)
      if (!input.success) return ack({ ok: false, error: "invalid" })
      const tournament = new Tournament(newId(), input.data.name, input.data.maxPlayers, player)
      this.tournaments.set(tournament.id, tournament)
      this.broadcastTournament(tournament)
      ack({ ok: true, id: tournament.id })
    })
    socket.on("tournament:watch", (raw, ack) => {
      if (typeof ack !== "function") return
      const tournament = this.findTournament(raw)
      if (!tournament) return ack({ ok: false, error: "notFound" })
      socket.join(rooms.tournament(tournament.id))
      ack({ ok: true, info: tournament.info() })
    })
    socket.on("tournament:unwatch", (raw) => {
      const id = idSchema.safeParse(raw)
      if (id.success) socket.leave(rooms.tournament(id.data))
    })
    socket.on("tournament:join", (raw, ack) => {
      if (typeof ack !== "function") return
      const tournament = this.findTournament(raw)
      if (!tournament) return ack({ ok: false, error: "notFound" })
      const result = tournament.join(player)
      if (result.ok) this.broadcastTournament(tournament)
      ack(result)
    })
    socket.on("tournament:leave", (raw, ack) => {
      if (typeof ack !== "function") return
      const tournament = this.findTournament(raw)
      if (!tournament) return ack({ ok: false, error: "notFound" })
      const result = tournament.leave(player.id)
      if (result.ok) {
        if (tournament.players.length === 0) this.tournaments.delete(tournament.id)
        this.broadcastTournament(tournament)
      }
      ack(result)
    })
    socket.on("tournament:start", (raw, ack) => {
      if (typeof ack !== "function") return
      const tournament = this.findTournament(raw)
      if (!tournament) return ack({ ok: false, error: "notFound" })
      ack(this.startTournament(tournament, player.id))
    })

    socket.on("disconnect", () => {
      this.stopWatching(socket)
      // Last tab of this player closed: they are no longer looking for a game.
      if (!this.io.sockets.adapter.rooms.get(rooms.player(player.id))?.size) {
        this.leaveQueue(player.id)
      }
    })
  }

  private stopWatching(socket: GameSocket) {
    const watching = socket.data.watching
    if (!watching) return
    socket.leave(rooms.match(watching.matchId))
    const match = this.matches.get(watching.matchId)
    if (match && watching.side) match.disconnect(watching.side)
    socket.data.watching = null
  }

  // --- Matchmaking --------------------------------------------------------

  /** True if the player has a game to play (now or soon, in a tournament). */
  private isBusy(playerId: string) {
    if (this.activeMatch.has(playerId)) return true
    for (const t of this.tournaments.values()) if (t.isStillIn(playerId)) return true
    return false
  }

  private joinQueue(player: PlayerRef): { ok: true } | { ok: false; error: ErrorCode } {
    if (this.isBusy(player.id)) return { ok: false, error: "alreadyInMatch" }
    if (this.queue.some((p) => p.id === player.id)) return { ok: true }

    const opponent = this.queue.shift()
    if (!opponent) {
      this.queue.push(player)
      return { ok: true }
    }
    // Random sides, then tell both players where to go.
    const [left, right] = shuffle([opponent, player])
    const match = this.createMatch(left, right, null)
    for (const p of [left, right]) {
      this.io.to(rooms.player(p.id)).emit("queue:matched", { matchId: match.id })
    }
    return { ok: true }
  }

  private leaveQueue(playerId: string) {
    this.queue = this.queue.filter((p) => p.id !== playerId)
  }

  private createMatch(left: PlayerRef, right: PlayerRef, tournamentId: string | null) {
    const id = newId()
    const room = rooms.match(id)
    const match = new Match(id, left, right, tournamentId, {
      onInfo: (info) => this.io.to(room).emit("match:info", info),
      onFrame: (frame) => this.io.to(room).emit("match:frame", frame),
      onEnd: (m) => this.onMatchEnd(m),
    })
    this.matches.set(id, match)
    this.activeMatch.set(left.id, id)
    this.activeMatch.set(right.id, id)
    return match
  }

  private onMatchEnd(match: Match) {
    const { left, right } = match.players
    this.activeMatch.delete(left.id)
    this.activeMatch.delete(right.id)
    // History, stats, leaderboard and XP. A database error must not stop
    // the game server (the tournament goes on).
    saveMatchResult(match).catch((error) => {
      console.error(`Could not save match ${match.id}:`, error)
    })

    if (match.tournamentId) {
      const tournament = this.tournaments.get(match.tournamentId)
      if (tournament && match.winner) {
        const score = match.score
        tournament.reportResult(match.id, match.players[match.winner].id, [
          score.left,
          score.right,
        ])
        this.launchTournamentMatches(tournament)
        this.broadcastTournament(tournament)
      }
    }
    setTimeout(() => this.matches.delete(match.id), KEEP_FINISHED_MATCH_MS)
  }

  // --- Tournaments --------------------------------------------------------

  private findTournament(raw: unknown) {
    const id = idSchema.safeParse(raw)
    return id.success ? this.tournaments.get(id.data) : undefined
  }

  private tournamentList() {
    return [...this.tournaments.values()].map((t) => t.summary())
  }

  private startTournament(
    tournament: Tournament,
    playerId: string
  ): { ok: true } | { ok: false; error: ErrorCode } {
    // Everyone must be free, otherwise their first game would start while
    // they are busy elsewhere and they would lose it by forfeit.
    if (tournament.players.some((p) => this.activeMatch.has(p.id))) {
      return { ok: false, error: "playersBusy" }
    }
    const result = tournament.start(playerId, shuffle)
    if (!result.ok) return result
    for (const p of tournament.players) this.leaveQueue(p.id)
    this.launchTournamentMatches(tournament)
    this.broadcastTournament(tournament)
    return result
  }

  /** Creates the games that became playable and tells their players. */
  private launchTournamentMatches(tournament: Tournament) {
    for (const { round, index, players } of tournament.pendingMatches()) {
      const match = this.createMatch(players[0], players[1], tournament.id)
      tournament.setMatchId(round, index, match.id)
      for (const p of players) {
        this.io
          .to(rooms.player(p.id))
          .emit("tournament:matchReady", { tournamentId: tournament.id, matchId: match.id })
      }
    }
    if (tournament.status === "finished") {
      setTimeout(() => {
        this.tournaments.delete(tournament.id)
        this.io.to(rooms.tournamentList).emit("tournament:list", this.tournamentList())
      }, KEEP_FINISHED_TOURNAMENT_MS)
    }
  }

  private broadcastTournament(tournament: Tournament) {
    this.io.to(rooms.tournament(tournament.id)).emit("tournament:update", tournament.info())
    this.io.to(rooms.tournamentList).emit("tournament:list", this.tournamentList())
  }
}
