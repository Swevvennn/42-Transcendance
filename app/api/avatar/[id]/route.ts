import { prisma } from "@/lib/prisma"

// Serves an uploaded avatar (see lib/actions/profile.ts). The URL stored in
// `user.image` ends with ?v=<upload time>, so a new picture gets a new URL.
// The cache stays short anyway: a removed picture must stop being served.
export async function GET(_request: Request, ctx: RouteContext<"/api/avatar/[id]">) {
  const { id } = await ctx.params
  const avatar = await prisma.avatar.findUnique({
    where: { userId: id },
    select: { data: true, mimeType: true },
  })
  if (!avatar) return new Response(null, { status: 404 })

  return new Response(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.mimeType,
      "Cache-Control": "private, max-age=300",
      // Never let the browser guess another type than the checked one.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  })
}
