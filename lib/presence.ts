// Online status of the players ("online", "in game", "offline").
//
// The game server (server/game-server.ts) knows who has a Socket.IO
// connection open and who is playing. Pages are rendered by Next.js in the
// same process (server.ts), so the game server registers itself on
// globalThis and pages ask it. Without the custom server (Vercel, `next dev`
// alone) everybody shows as offline.

export type UserStatus = "online" | "offline" | "inGame"

type PresenceSource = { statusOf(userId: string): UserStatus }

const registry = globalThis as { __transcendencePresence?: PresenceSource }

export function setPresenceSource(source: PresenceSource) {
  registry.__transcendencePresence = source
}

export function userStatus(userId: string): UserStatus {
  return registry.__transcendencePresence?.statusOf(userId) ?? "offline"
}
