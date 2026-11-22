import { createServer } from "node:http"

import next from "next"
import { collectDefaultMetrics, Gauge, register } from "prom-client" // [MONITORING]
import { Server } from "socket.io"

import { GameServer, type GameIO } from "@/server/game-server"

// Custom server: Next.js (pages, API) and Socket.IO (real-time game) share
// the same HTTP server and the same port. Started with `bun run dev` or
// `bun run start` (see package.json). Vercel does not run this file.

const port = Number(process.env.PORT ?? 3000)
const dev = process.env.NODE_ENV !== "production"

// [MONITORING] Mesures automatiques du processus : RAM, temps CPU, etc.
// Elles sont rangees dans `register` (le registre global de prom-client).
collectDefaultMetrics()

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

// [MONITORING] Jauge (valeur qui monte et descend) : nombre de clients
// Socket.IO connectes. collect() est appele a chaque lecture de /metrics,
// donc la valeur est toujours a jour sans toucher au code du jeu.
new Gauge({
  name: "pongo_connected_players",
  help: "Nombre de clients connectes sur Socket.IO",
  collect() {
    this.set(io.engine.clientsCount)
  },
})

httpServer.on("request", async (req, res) => {
  // [MONITORING] Prometheus lit cette page (texte brut) toutes les 15 s.
  // On compare seulement le chemin (sans un eventuel ?query).
  // nginx bloque /metrics depuis l'exterieur : seul Prometheus, sur le
  // reseau Docker interne (app:3000), peut la lire.
  if (req.url?.split("?")[0] === "/metrics") {
    try {
      // register.metrics() est async : il rassemble toutes les mesures.
      const body = await register.metrics()
      res.writeHead(200, { "Content-Type": register.contentType })
      res.end(body)
    } catch (error) {
      console.error("Could not collect metrics:", error)
      res.writeHead(500)
      res.end()
    }
    return
  }

  // Socket.IO answers its own requests (/socket.io/…), Next.js the rest.
  if (req.url?.startsWith("/socket.io/")) return
  handle(req, res)
})

httpServer.listen(port, () => {
  console.log(`> Ready on http://localhost:${port} (${dev ? "dev" : "production"})`)
})
