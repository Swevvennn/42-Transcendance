import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

// One Prisma client for the whole server. Kept on globalThis because this
// file can be loaded more than once: by hot reload in dev, and in production
// by both server.ts (game server) and the Next.js bundle (pages, actions).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })

globalForPrisma.prisma = prisma
