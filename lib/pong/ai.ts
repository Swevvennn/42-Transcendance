// AI opponent for Pong. Pure logic, no DOM: the caller owns the loop.
//
// It plays like a human would:
// - it only "looks" at the ball once per second (VIEW_INTERVAL) and plans
//   from that snapshot, predicting wall bounces to guess where the ball lands;
// - it reacts with a delay and aims with an error that grows with ball speed;
// - it sometimes misreads the ball completely, so it can lose;
// - it moves with the same input as a player (up / down / still), at the
//   same paddle speed, so it gets no physics advantage.

import {
  BALL_SIZE,
  HEIGHT,
  PADDLE_H,
  PADDLE_MARGIN,
  PADDLE_W,
  WIDTH,
  type Direction,
  type PongState,
  type Side,
} from "./engine"

export const AI_LEVELS = ["easy", "normal", "hard"] as const
export type AiLevel = (typeof AI_LEVELS)[number]

/** The AI refreshes its view of the game once per second. */
export const VIEW_INTERVAL = 1

type Profile = {
  /** Seconds between seeing the ball and starting to move. */
  reaction: number
  /** Typical aiming error, in px (scaled up with ball speed). */
  error: number
  /** Chance to completely misjudge a shot. */
  blunder: number
  /** Distance (px) under which the paddle stops moving: avoids jitter. */
  deadZone: number
}

const PROFILES: Record<AiLevel, Profile> = {
  easy: { reaction: 0.4, error: 55, blunder: 0.3, deadZone: 18 },
  normal: { reaction: 0.25, error: 30, blunder: 0.12, deadZone: 10 },
  hard: { reaction: 0.12, error: 12, blunder: 0.03, deadZone: 6 },
}

export type AiBrain = {
  level: AiLevel
  side: Side
  /** Time left before the next look at the ball. */
  untilView: number
  /** Time left before the planned target is acted on. */
  untilReact: number
  /** Target the AI is moving to (paddle center Y). */
  target: number
  /** Target planned at the last look, used once the reaction delay ends. */
  planned: number
}

export function createAi(level: AiLevel, side: Side = "right"): AiBrain {
  return {
    level,
    side,
    untilView: 0,
    untilReact: 0,
    target: HEIGHT / 2,
    planned: HEIGHT / 2,
  }
}

/**
 * Call after each serve: like a player, the AI watches the serve, so its
 * next look comes a moment later instead of up to a second later.
 */
export function aiOnServe(ai: AiBrain) {
  ai.untilView = Math.min(ai.untilView, 0.1 + Math.random() * 0.2)
}

/** Folds a straight-line Y into the court, as if the ball bounced on walls. */
function foldY(y: number) {
  const max = HEIGHT - BALL_SIZE
  const period = 2 * max
  const m = ((y % period) + period) % period
  return m <= max ? m : period - m
}

/**
 * Where the ball's center will be (Y) when it reaches the paddle on `side`,
 * or null if the ball is not coming towards it.
 */
export function predictImpact(
  s: Pick<PongState, "ballX" | "ballY" | "vx" | "vy">,
  side: Side
): number | null {
  const towards = side === "right" ? s.vx > 0 : s.vx < 0
  if (!towards) return null
  const x =
    side === "right"
      ? WIDTH - PADDLE_MARGIN - PADDLE_W - BALL_SIZE
      : PADDLE_MARGIN + PADDLE_W
  const t = (x - s.ballX) / s.vx
  if (t < 0) return null
  return foldY(s.ballY + s.vy * t) + BALL_SIZE / 2
}

/** Gaussian-ish noise in [-1, 1], centered on 0. */
const noise = () => (Math.random() + Math.random() + Math.random()) / 1.5 - 1

/** Picks where to go from a snapshot of the game. */
function plan(ai: AiBrain, s: PongState): number {
  const p = PROFILES[ai.level]
  const impact = predictImpact(s, ai.side)

  // Ball going away: drift back towards the middle, loosely.
  if (impact === null) return HEIGHT / 2 + noise() * p.error

  // Faster balls are harder to read.
  const speed = Math.hypot(s.vx, s.vy)
  let error = noise() * p.error * (speed / 380)
  if (Math.random() < p.blunder) {
    // Misjudged the shot: off by more than a paddle.
    error += (Math.random() < 0.5 ? -1 : 1) * (PADDLE_H * 0.6 + Math.random() * PADDLE_H)
  }
  // Hit with the edge of the paddle on purpose sometimes, to send an angle.
  const aim = noise() * PADDLE_H * 0.3
  return impact + error + aim
}

/**
 * Advances the AI by `dt` seconds and returns the key it "holds".
 * Call it every physics step, with the live state: the AI itself only reads
 * the ball once per VIEW_INTERVAL; it always knows where its own paddle is.
 */
export function aiInput(ai: AiBrain, s: PongState, dt: number): Direction {
  const p = PROFILES[ai.level]

  ai.untilView -= dt
  if (ai.untilView <= 0) {
    ai.untilView += VIEW_INTERVAL
    ai.planned = plan(ai, s)
    ai.untilReact = p.reaction * (0.7 + Math.random() * 0.6)
  }

  if (ai.untilReact > 0) {
    ai.untilReact -= dt
    if (ai.untilReact <= 0) ai.target = ai.planned
  }

  const paddleY = ai.side === "right" ? s.rightY : s.leftY
  const diff = ai.target - (paddleY + PADDLE_H / 2)
  if (Math.abs(diff) < p.deadZone) return 0
  return diff < 0 ? -1 : 1
}
