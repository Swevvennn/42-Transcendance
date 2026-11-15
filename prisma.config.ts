import { defineConfig } from "prisma/config"

// Prisma 7 config. bun loads .env automatically, Docker passes DATABASE_URL.
// `prisma generate` doesn't need a database, hence the empty fallback.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
})
