import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
  // Comma-separated hosts allowed to reach the dev server, e.g. to test on a phone.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",") ?? [],
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
