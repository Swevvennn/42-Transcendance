// Messages exchanged between the browser and the game server over Socket.IO.
// Both sides import these types, so a renamed event or field is a type error.

import type { Direction, Side } from "@/lib/pong/engine"

export type PlayerRef = { id: string; name: string }

// --- Matches ---------------------------------------------------------------

export type MatchStatus =
  | "waiting" // created, at least one player has never connected
  | "countdown" // both players here, the ball starts in a few seconds
  | "playing"
  | "paused" // a player disconnected, waiting for them to come back
  | "over"

export type MatchEndReason = "score" | "forfeit"

/** Everything about a match except the moving objects (sent on change). */
export type MatchInfo = {
  id: string
  players: Record<Side, PlayerRef>
  connected: Record<Side, boolean>
  status: MatchStatus
  /** Server timestamp (ms) when the countdown / reconnection wait ends. */
  deadline: number | null
  winner: Side | null
  endReason: MatchEndReason | null
  tournamentId: string | null
}

/** Positions and score, sent every server tick (~60/s). */
export type MatchFrame = {
  t: number // server time (ms)
  leftY: number
  rightY: number
  ballX: number
  ballY: number
  score: { left: number; right: number }
}

/** A match in progress, for the "live matches" list (spectator mode). */
export type LiveMatch = {
  id: string
  players: Record<Side, PlayerRef>
  status: Exclude<MatchStatus, "over">
  score: { left: number; right: number }
  tournament: boolean
}

export type JoinMatchResult =
  | { ok: true; role: Side | "spectator"; info: MatchInfo; serverNow: number }
  | { ok: false; error: "notFound" }

// --- Tournaments -----------------------------------------------------------

export type TournamentStatus = "lobby" | "running" | "finished"

export type BracketSlot = PlayerRef | null

export type BracketMatch = {
  /** Id of the online match, once both players are known. */
  matchId: string | null
  players: [BracketSlot, BracketSlot]
  winnerId: string | null
  score: [number, number] | null
  /** True when a player got through without playing (odd number of players). */
  bye: boolean
}

export type TournamentInfo = {
  id: string
  name: string
  hostId: string
  maxPlayers: number
  status: TournamentStatus
  players: PlayerRef[]
  /** rounds[0] = first round … last = final. Empty while in the lobby. */
  rounds: BracketMatch[][]
  winner: PlayerRef | null
}

export type TournamentSummary = Pick<
  TournamentInfo,
  "id" | "name" | "maxPlayers" | "status"
> & { playerCount: number; hostName: string }

/** Error codes, translated on the client under `Online.errors.*`. */
export type ErrorCode =
  | "invalid"
  | "notFound"
  | "alreadyInMatch"
  | "tournamentFull"
  | "tournamentStarted"
  | "notHost"
  | "notEnoughPlayers"
  | "playersBusy"

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; error: ErrorCode }

// --- Socket.IO event maps --------------------------------------------------

export type SessionInfo = { activeMatchId: string | null }

export interface ServerToClientEvents {
  "queue:matched": (payload: { matchId: string }) => void
  "match:info": (info: MatchInfo) => void
  "match:frame": (frame: MatchFrame) => void
  "matches:list": (list: LiveMatch[]) => void
  "tournament:list": (list: TournamentSummary[]) => void
  "tournament:update": (info: TournamentInfo) => void
  "tournament:matchReady": (payload: { tournamentId: string; matchId: string }) => void
}

export interface ClientToServerEvents {
  "session:get": (ack: (info: SessionInfo) => void) => void
  "queue:join": (ack: (res: Ack) => void) => void
  "queue:leave": () => void
  "match:join": (matchId: unknown, ack: (res: JoinMatchResult) => void) => void
  "match:leave": (matchId: unknown) => void
  "match:input": (direction: unknown) => void
  "match:forfeit": (matchId: unknown) => void
  "matches:subscribe": (ack: (list: LiveMatch[]) => void) => void
  "matches:unsubscribe": () => void
  "tournament:subscribeList": (ack: (list: TournamentSummary[]) => void) => void
  "tournament:unsubscribeList": () => void
  "tournament:create": (input: unknown, ack: (res: Ack<{ id: string }>) => void) => void
  "tournament:watch": (
    id: unknown,
    ack: (res: Ack<{ info: TournamentInfo }>) => void
  ) => void
  "tournament:unwatch": (id: unknown) => void
  "tournament:join": (id: unknown, ack: (res: Ack) => void) => void
  "tournament:leave": (id: unknown, ack: (res: Ack) => void) => void
  "tournament:start": (id: unknown, ack: (res: Ack) => void) => void
}

export type { Direction, Side }
