/**
 * The 42 intra app credentials, or null if they are not in the env.
 * Read at request time (the Docker image is built without the .env).
 */
export function fortyTwoCredentials() {
  const clientId = process.env.FT_CLIENT_ID
  const clientSecret = process.env.FT_CLIENT_SECRET
  return clientId && clientSecret ? { clientId, clientSecret } : null
}
