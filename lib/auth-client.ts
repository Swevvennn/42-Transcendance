import { twoFactorClient, usernameClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

// Better Auth, browser side. Talks to /api/auth/* on the same site.
export const authClient = createAuthClient({
  // The login form handles the "2FA code" step itself (twoFactorRedirect).
  plugins: [usernameClient(), twoFactorClient()],
})

export const { useSession, signIn, signUp, signOut, twoFactor } = authClient
