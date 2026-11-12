import { z } from "zod"

// Shared by the tournament form (client) and the game server (server/),
// which re-validates every payload it receives. Messages are `Validation.*` keys.

export const tournamentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { error: "tournamentNameLength" })
    .max(30, { error: "tournamentNameLength" }),
  maxPlayers: z.coerce
    .number()
    .refine((n) => n === 4 || n === 8, { error: "tournamentSize" }),
})

// Server-only checks on socket payloads.
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{6,40}$/)
export const directionSchema = z.union([z.literal(-1), z.literal(0), z.literal(1)])

export type TournamentFormInput = z.infer<typeof tournamentFormSchema>
