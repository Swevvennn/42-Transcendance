import { createServer } from "node:http"

import next from "next"
import { Server } from "socket.io"

import { GameServer, type GameIO } from "@/server/game-server"

// Custom server: Next.js (pages, API) and Socket.IO (real-time game) share
// the same HTTP server and the same port. Started with `bun run dev` or
// `bun run start` (see package.json). Vercel does not run this file.

const port = Number(process.env.PORT ?? 3000)
const dev = process.env.NODE_ENV !== "production"

const httpServer = createServer()
// Passing httpServer lets Next.js handle its own WebSocket upgrades
// (hot reload in dev) next to Socket.IO's.
const app = next({ dev, httpServer, port, hostname: "0.0.0.0" })
const handle = app.getRequestHandler()

await app.prepare()

const io: GameIO = new Server(httpServer, {
  // Don't kill WebSocket upgrades meant for Next.js (dev hot reload).
  destroyUpgrade: false,
})
new GameServer(io)

httpServer.on("request", (req, res) => {
  // Socket.IO answers its own requests (/socket.io/…), Next.js the rest.
  if (req.url?.startsWith("/socket.io/")) return
  handle(req, res)
})

httpServer.listen(port, () => {
  console.log(`> Ready on http://localhost:${port} (${dev ? "dev" : "production"})`)
})
