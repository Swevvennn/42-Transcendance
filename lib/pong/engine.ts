// Pong physics shared by the local game (browser) and the online game server.
// Pure functions only: no timers, no DOM, no network. The caller owns the loop.

export const WIDTH = 800
export const HEIGHT = 500
export const PADDLE_W = 12
export const PADDLE_H = 90
export const PADDLE_MARGIN = 24
export const PADDLE_SPEED = 450 // px/s
export const BALL_SIZE = 12
export const BALL_SPEED = 380 // px/s
export const BALL_SPEED_MAX = 900
export const WIN_SCORE = 5
// Physics sub-step, small enough that a fast ball cannot pass through a paddle.
export const SUB_STEP = 1 / 240

export type Side = "left" | "right"

/** -1 = up, 0 = still, 1 = down. */
export type Direction = -1 | 0 | 1

export type PongState = {
  leftY: number
  rightY: number
  ballX: number
  ballY: number
  vx: number
  vy: number
  score: { left: number; right: number }
}

export function initialState(): PongState {
  return {
    leftY: (HEIGHT - PADDLE_H) / 2,
    rightY: (HEIGHT - PADDLE_H) / 2,
    ballX: (WIDTH - BALL_SIZE) / 2,
    ballY: (HEIGHT - BALL_SIZE) / 2,
    vx: 0,
    vy: 0,
    score: { left: 0, right: 0 },
  }
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

/** Puts the ball back in the center, heading towards `towards`. */
export function serve(s: PongState, towards: Side) {
  const angle = (Math.random() - 0.5) * (Math.PI / 3) // ±30°
  const dir = towards === "left" ? -1 : 1
  s.ballX = (WIDTH - BALL_SIZE) / 2
  s.ballY = (HEIGHT - BALL_SIZE) / 2
  s.vx = Math.cos(angle) * BALL_SPEED * dir
  s.vy = Math.sin(angle) * BALL_SPEED
}

/** Stops the ball in the center (used between a goal and the next serve). */
export function centerBall(s: PongState) {
  s.ballX = (WIDTH - BALL_SIZE) / 2
  s.ballY = (HEIGHT - BALL_SIZE) / 2
  s.vx = 0
  s.vy = 0
}

/**
 * Advances the game by `dt` seconds (call it with dt <= SUB_STEP).
 * Returns the side that scored during this step, or null.
 */
export function step(
  s: PongState,
  dt: number,
  input: { left: Direction; right: Direction }
): Side | null {
  const maxY = HEIGHT - PADDLE_H
  s.leftY = clamp(s.leftY + input.left * PADDLE_SPEED * dt, 0, maxY)
  s.rightY = clamp(s.rightY + input.right * PADDLE_SPEED * dt, 0, maxY)

  s.ballX += s.vx * dt
  s.ballY += s.vy * dt

  // Top / bottom walls.
  if (s.ballY <= 0 || s.ballY >= HEIGHT - BALL_SIZE) {
    s.ballY = clamp(s.ballY, 0, HEIGHT - BALL_SIZE)
    s.vy = -s.vy
  }

  // Paddles: the bounce angle depends on where the ball hits.
  const hit = (paddleX: number, paddleY: number, dir: 1 | -1) => {
    const overlapX = s.ballX < paddleX + PADDLE_W && s.ballX + BALL_SIZE > paddleX
    const overlapY = s.ballY < paddleY + PADDLE_H && s.ballY + BALL_SIZE > paddleY
    if (!overlapX || !overlapY || Math.sign(s.vx) === dir) return
    const offset =
      (s.ballY + BALL_SIZE / 2 - (paddleY + PADDLE_H / 2)) / (PADDLE_H / 2)
    const angle = offset * (Math.PI / 4) // up to ±45°
    const speed = Math.min(Math.hypot(s.vx, s.vy) * 1.05, BALL_SPEED_MAX)
    s.vx = Math.cos(angle) * speed * dir
    s.vy = Math.sin(angle) * speed
    s.ballX = dir === 1 ? paddleX + PADDLE_W : paddleX - BALL_SIZE
  }
  hit(PADDLE_MARGIN, s.leftY, 1)
  hit(WIDTH - PADDLE_MARGIN - PADDLE_W, s.rightY, -1)

  // Goals.
  let scorer: Side | null = null
  if (s.ballX + BALL_SIZE < 0) scorer = "right"
  else if (s.ballX > WIDTH) scorer = "left"
  if (scorer) s.score = { ...s.score, [scorer]: s.score[scorer] + 1 }
  return scorer
}

/** Draws a frame. `fg` is the theme foreground color. */
export function drawPong(
  ctx: CanvasRenderingContext2D,
  s: Pick<PongState, "leftY" | "rightY" | "ballX" | "ballY">,
  fg: string
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = fg

  ctx.globalAlpha = 0.3
  for (let y = 0; y < HEIGHT; y += 24) {
    ctx.fillRect(WIDTH / 2 - 1, y, 2, 12)
  }
  ctx.globalAlpha = 1

  ctx.fillRect(PADDLE_MARGIN, s.leftY, PADDLE_W, PADDLE_H)
  ctx.fillRect(WIDTH - PADDLE_MARGIN - PADDLE_W, s.rightY, PADDLE_W, PADDLE_H)
  ctx.fillRect(s.ballX, s.ballY, BALL_SIZE, BALL_SIZE)
}
