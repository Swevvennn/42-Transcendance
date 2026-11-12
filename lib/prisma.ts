import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

// One Prisma client for the whole server. In dev, hot reload re-runs this
// file, so the client is kept on globalThis to avoid opening new connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
