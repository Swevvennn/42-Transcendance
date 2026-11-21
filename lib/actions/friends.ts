"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { currentSession, findProfile } from "@/lib/users"
import { addFriendSchema, friendshipIdSchema } from "@/lib/validation/friends"

// Server actions for friends. Every input is checked again here (zod), and
// the logged-in user is read from the session cookie, never from the client.

export type FriendErrorKey = "unauthorized" | "notFound" | "self" | "already" | "invalid"
export type FriendResult = { ok: true } | { ok: false; error: FriendErrorKey }

const done = (): FriendResult => {
  revalidatePath("/[locale]/profile", "layout")
  return { ok: true }
}

async function me() {
  const session = await currentSession()
  return session?.user.id ?? null
}

/** Sends a request, or accepts the one this user already sent us. */
export async function sendFriendRequest(input: unknown): Promise<FriendResult> {
  const userId = await me()
  if (!userId) return { ok: false, error: "unauthorized" }
  const parsed = addFriendSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid" }

  const other = await findProfile(parsed.data.username)
  if (!other) return { ok: false, error: "notFound" }
  if (other.id === userId) return { ok: false, error: "self" }

  // A and B sending each other a request at the same moment would create two
  // rows (A→B and B→A). A lock on the pair makes the second one wait and
  // find the first.
  const pair = [userId, other.id].sort().join(":")
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pair}))`
    const existing = await tx.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: other.id },
          { requesterId: other.id, addresseeId: userId },
        ],
      },
    })
    if (existing) {
      if (existing.status === "pending" && existing.addresseeId === userId) {
        await tx.friendship.update({ where: { id: existing.id }, data: { status: "accepted" } })
        return "ok"
      }
      return "already"
    }
    await tx.friendship.create({ data: { requesterId: userId, addresseeId: other.id } })
    return "ok"
  })
  return result === "ok" ? done() : { ok: false, error: "already" }
}

/** Accepts a request sent to this user. */
export async function acceptFriendRequest(id: unknown): Promise<FriendResult> {
  const userId = await me()
  if (!userId) return { ok: false, error: "unauthorized" }
  const parsed = friendshipIdSchema.safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid" }

  const { count } = await prisma.friendship.updateMany({
    where: { id: parsed.data, addresseeId: userId, status: "pending" },
    data: { status: "accepted" },
  })
  return count ? done() : { ok: false, error: "notFound" }
}

/** Removes a friend, declines a request or cancels one we sent. */
export async function removeFriendship(id: unknown): Promise<FriendResult> {
  const userId = await me()
  if (!userId) return { ok: false, error: "unauthorized" }
  const parsed = friendshipIdSchema.safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid" }

  const { count } = await prisma.friendship.deleteMany({
    where: { id: parsed.data, OR: [{ requesterId: userId }, { addresseeId: userId }] },
  })
  return count ? done() : { ok: false, error: "notFound" }
}
