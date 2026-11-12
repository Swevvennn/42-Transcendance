import { betterAuth, type BetterAuthPlugin } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { genericOAuth, twoFactor, username } from "better-auth/plugins"
import type { z } from "zod"

import { fortyTwoCredentials } from "@/lib/oauth42"
import { prisma } from "@/lib/prisma"
import {
  backupCodeSchema,
  loginSchema,
  passwordConfirmSchema,
  signupApiSchema,
  totpCodeSchema,
} from "@/lib/validation/auth"

// Better Auth, server side. It exposes its API under /api/auth/* (see
// app/api/auth/[...all]/route.ts) and stores users, sessions and accounts in
// PostgreSQL through Prisma. Passwords are hashed (scrypt) by Better Auth.
//
// Env: BETTER_AUTH_SECRET (signs the cookies), BETTER_AUTH_URL (site URL),
// FT_CLIENT_ID / FT_CLIENT_SECRET (optional, "Continue with 42").

/** Error code sent back when a form field is invalid (message = Validation key). */
export const VALIDATION_ERROR = "VALIDATION_FAILED"

/** Provider id of the 42 intra. Callback URL: <BETTER_AUTH_URL>/api/auth/callback/42 */
export const FT_PROVIDER_ID = "42"

function check(schema: z.ZodType, body: unknown) {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw new APIError("BAD_REQUEST", {
      code: VALIDATION_ERROR,
      message: result.error.issues[0].message,
    })
  }
}

/** Better Auth routes whose body is checked with our shared zod schemas. */
const validatedRoutes: Record<string, z.ZodType | undefined> = {
  "/sign-up/email": signupApiSchema,
  "/sign-in/email": loginSchema,
  "/two-factor/verify-totp": totpCodeSchema,
  "/two-factor/verify-backup-code": backupCodeSchema,
  "/two-factor/enable": passwordConfirmSchema,
  "/two-factor/disable": passwordConfirmSchema,
}

/** The part of https://api.intra.42.fr/v2/me we use. */
type FortyTwoUser = {
  id: number
  email: string
  login: string
  image?: { link?: string | null; versions?: { medium?: string | null } }
}

/** "Continue with 42" (OAuth 2.0), only if the app credentials are set. */
function fortyTwo(): BetterAuthPlugin[] {
  const credentials = fortyTwoCredentials()
  if (!credentials) return []
  const { clientId, clientSecret } = credentials
  return [
    genericOAuth({
      config: [
        {
          providerId: FT_PROVIDER_ID,
          name: "42",
          clientId,
          clientSecret,
          authorizationUrl: "https://api.intra.42.fr/oauth/authorize",
          tokenUrl: "https://api.intra.42.fr/oauth/token",
          scopes: ["public"],
          async getUserInfo(tokens) {
            const res = await fetch("https://api.intra.42.fr/v2/me", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            })
            if (!res.ok) return null
            const me = (await res.json()) as FortyTwoUser
            return {
              id: String(me.id),
              email: me.email,
              // 42 checks the student emails.
              emailVerified: true,
              name: me.login,
              image: me.image?.versions?.medium ?? me.image?.link ?? undefined,
            }
          },
        },
      ],
    }),
  ]
}

/**
 * A free username based on `name` (for 42 accounts: the intra login).
 * Same rules as the sign-up form: 3-20 letters, digits or underscores.
 */
async function freeUsername(name: string) {
  let base = name.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 16)
  if (base.length < 3) base = `player${base}`
  for (let i = 0; ; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 15)}_${Math.floor(Math.random() * 10_000)}`
    const taken = await prisma.user.findUnique({
      where: { username: candidate.toLowerCase() },
      select: { id: true },
    })
    if (!taken) return candidate
  }
}

export const auth = betterAuth({
  appName: "Transcendence",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  plugins: [
    // Unique usernames (stored lowercase, `displayUsername` keeps the case).
    username({ minUsernameLength: 3, maxUsernameLength: 20 }),
    // 2FA with an authenticator app (TOTP) + backup codes. Asked at email login.
    twoFactor({ issuer: "Transcendence" }),
    ...fortyTwo(),
    // Lets server actions set cookies. Must stay last.
    nextCookies(),
  ],
  databaseHooks: {
    user: {
      create: {
        // Accounts created through 42 have no username yet: take the login
        // (or the login + a number if someone already uses it).
        async before(user) {
          if (typeof user.username === "string" && user.username) return
          const name = await freeUsername(user.name)
          return {
            data: { ...user, name, username: name.toLowerCase(), displayUsername: name },
          }
        },
      },
    },
  },
  hooks: {
    // Back-end validation with the same zod schemas as the forms.
    before: createAuthMiddleware(async (ctx) => {
      const schema = validatedRoutes[ctx.path]
      if (schema) check(schema, ctx.body)
    }),
  },
})

export type Session = typeof auth.$Infer.Session
