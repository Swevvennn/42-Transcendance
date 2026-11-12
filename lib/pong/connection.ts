"use client"

import { useSyncExternalStore } from "react"
import { io, type Socket } from "socket.io-client"

import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/pong/protocol"

// One Socket.IO connection shared by every online page (lobby, match,
// tournament). It is a small store read with useSyncExternalStore.
//
// No identity is sent by hand: the browser automatically sends the Better
// Auth session cookie with the connection, and the server reads the user
// from it (server/game-server.ts → authenticate).

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export type ConnectionState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "connected"; socket: GameSocket }
  | { status: "error" }

let state: ConnectionState = { status: "idle" }
let socket: GameSocket | null = null
/** The user the current socket belongs to. */
let socketUserId: string | null = null
const listeners = new Set<() => void>()

function setState(next: ConnectionState) {
  state = next
  listeners.forEach((listener) => listener())
}

/** Connects as `userId`, or reconnects if another user logged in. */
export function connectAs(userId: string) {
  if (socket && socketUserId === userId) return
  disconnect()
  const s: GameSocket = io({ transports: ["websocket", "polling"] })
  socket = s
  socketUserId = userId
  setState({ status: "connecting" })

  s.on("connect", () => setState({ status: "connected", socket: s }))
  s.on("connect_error", () => {
    // Socket.IO keeps retrying on its own; we just show the problem.
    if (socket === s) setState({ status: "error" })
  })
  s.on("disconnect", () => {
    if (socket === s) setState({ status: "connecting" })
  })
}

/** Closes the connection (logout). */
export function disconnect() {
  socket?.disconnect()
  socket = null
  socketUserId = null
  if (state.status !== "idle") setState({ status: "idle" })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const serverState: ConnectionState = { status: "idle" }

export function useConnection() {
  return useSyncExternalStore(subscribe, () => state, () => serverState)
}
