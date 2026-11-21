import {
  centerBall,
  initialState,
  serve,
  step,
  SUB_STEP,
  WIN_SCORE,
  type Direction,
  type PongState,
  type Side,
} from "@/lib/pong/engine"
import type {
  LiveMatch,
  MatchEndReason,
  MatchFrame,
  MatchInfo,
  MatchStatus,
  PlayerRef,
} from "@/lib/pong/protocol"

// One online game. The server is the only one who simulates it: clients only
// send "up / down / nothing" and receive the positions (MatchFrame).

/** Time a player has to show up for the first time. */
export const JOIN_TIMEOUT_MS = 30_000
/** Time a disconnected player has to come back before losing by forfeit. */
export const RECONNECT_TIMEOUT_MS = 15_000
const START_COUNTDOWN_MS = 3_000
const POINT_PAUSE_MS = 1_000

const SIDES: Side[] = ["left", "right"]
const other = (side: Side): Side => (side === "left" ? "right" : "left")

type MatchEvents = {
  /** Status, connections or result changed. */
  onInfo: (info: MatchInfo) => void
  onFrame: (frame: MatchFrame) => void
  onEnd: (match: Match) => void
}

export class Match {
  readonly players: Record<Side, PlayerRef>
  status: MatchStatus = "waiting"
  /** When the current countdown / wait ends (server time, ms). */
  deadline: number | null = null
  winner: Side | null = null
  endReason: MatchEndReason | null = null
  readonly createdAt = new Date()

  private state: PongState = initialState()
  private input: Record<Side, Direction> = { left: 0, right: 0 }
  /** Number of open sockets per player (a player can reload, open 2 tabs…). */
  private sockets: Record<Side, number> = { left: 0, right: 0 }
  /** For each absent player: when they lose by forfeit. */
  private absentUntil: Record<Side, number | null>
  private nextServe: Side = Math.random() < 0.5 ? "left" : "right"
  private lastTick: number

  constructor(
    readonly id: string,
    left: PlayerRef,
    right: PlayerRef,
    readonly tournamentId: string | null,
    private readonly events: MatchEvents
  ) {
    this.players = { left, right }
    const now = Date.now()
    this.lastTick = now
    this.absentUntil = { left: now + JOIN_TIMEOUT_MS, right: now + JOIN_TIMEOUT_MS }
    this.deadline = now + JOIN_TIMEOUT_MS
  }

  sideOf(playerId: string): Side | null {
    return SIDES.find((side) => this.players[side].id === playerId) ?? null
  }

  get isOver() {
    return this.status === "over"
  }

  info(): MatchInfo {
    return {
      id: this.id,
      players: this.players,
      connected: { left: this.sockets.left > 0, right: this.sockets.right > 0 },
      status: this.status,
      deadline: this.deadline,
      winner: this.winner,
      endReason: this.endReason,
      tournamentId: this.tournamentId,
    }
  }

  /** Short form for the list of live matches (null once finished). */
  summary(): LiveMatch | null {
    if (this.status === "over") return null
    return {
      id: this.id,
      players: this.players,
      status: this.status,
      score: { ...this.state.score },
      tournament: this.tournamentId !== null,
    }
  }

  frame(now = Date.now()): MatchFrame {
    const s = this.state
    const r = (v: number) => Math.round(v * 10) / 10
    return {
      t: now,
      leftY: r(s.leftY),
      rightY: r(s.rightY),
      ballX: r(s.ballX),
      ballY: r(s.ballY),
      score: s.score,
    }
  }

  get score() {
    return this.state.score
  }

  connect(side: Side) {
    this.sockets[side] += 1
    this.absentUntil[side] = null
    this.events.onInfo(this.info())
  }

  disconnect(side: Side) {
    this.sockets[side] = Math.max(0, this.sockets[side] - 1)
    if (this.sockets[side] > 0 || this.isOver) return
    this.input[side] = 0
    this.absentUntil[side] = Date.now() + RECONNECT_TIMEOUT_MS
    this.events.onInfo(this.info())
  }

  setInput(side: Side, direction: Direction) {
    this.input[side] = direction
  }

  forfeit(loser: Side) {
    this.end(other(loser), "forfeit")
  }

  /** Called ~60 times per second by the game server. */
  tick(now: number) {
    if (this.isOver) return
    const dt = Math.min((now - this.lastTick) / 1000, 0.05)
    this.lastTick = now

    // 1. Absent for too long → forfeit (if both are, the first one gone loses).
    const expired = SIDES.filter((side) => {
      const until = this.absentUntil[side]
      return until !== null && until <= now
    })
    if (expired.length > 0) {
      const loser = expired.reduce((a, b) =>
        this.absentUntil[a]! <= this.absentUntil[b]! ? a : b
      )
      this.forfeit(loser)
      return
    }

    // 2. Someone is missing → wait for them.
    const missing = SIDES.filter((side) => this.sockets[side] === 0)
    if (missing.length > 0) {
      const deadline = Math.min(...missing.map((side) => this.absentUntil[side]!))
      const status = this.status === "waiting" ? "waiting" : "paused"
      if (this.status !== status || this.deadline !== deadline) {
        this.status = status
        this.deadline = deadline
        this.events.onInfo(this.info())
      }
      return
    }

    // 3. Everyone is here.
    if (this.status === "waiting" || this.status === "paused") {
      this.setStatus("countdown", now + START_COUNTDOWN_MS)
    } else if (this.status === "countdown" && now >= this.deadline!) {
      const s = this.state
      if (s.vx === 0 && s.vy === 0) serve(s, this.nextServe)
      this.setStatus("playing", null)
    } else if (this.status === "playing") {
      this.simulate(dt, now)
    }

    if (!this.isOver) this.events.onFrame(this.frame(now))
  }

  private simulate(dt: number, now: number) {
    const s = this.state
    let remaining = dt
    while (remaining > 0) {
      const sub = Math.min(remaining, SUB_STEP)
      remaining -= sub
      const scorer = step(s, sub, this.input)
      if (!scorer) continue

      if (s.score[scorer] >= WIN_SCORE) {
        this.end(scorer, "score")
        return
      }
      // Short break, then the ball goes towards the player who conceded.
      centerBall(s)
      this.nextServe = other(scorer)
      this.setStatus("countdown", now + POINT_PAUSE_MS)
      return
    }
  }

  private setStatus(status: MatchStatus, deadline: number | null) {
    this.status = status
    this.deadline = deadline
    this.events.onInfo(this.info())
  }

  private end(winner: Side, reason: MatchEndReason) {
    if (this.isOver) return
    centerBall(this.state)
    this.winner = winner
    this.endReason = reason
    this.input = { left: 0, right: 0 }
    this.setStatus("over", null)
    this.events.onFrame(this.frame())
    this.events.onEnd(this)
  }
}
