"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { currentSession } from "@/lib/users"
import type { ValidationKey } from "@/lib/validation/auth"
import { avatarSchema, profileSchema, type ProfileInput } from "@/lib/validation/profile"

// Server actions of the settings page: edit username / email, upload or
// remove the avatar. Every input is checked again here with the same zod
// schemas as the forms, and the user always comes from the session cookie.

export type ProfileErrorKey = "unauthorized" | "invalid"
export type ProfileResult =
  | { ok: true }
  | { ok: false; error: ProfileErrorKey }
  | { ok: false; field: keyof ProfileInput; key: ValidationKey }
export type AvatarResult = { ok: true } | { ok: false; error: ProfileErrorKey | ValidationKey }

const refresh = () => revalidatePath("/[locale]", "layout")

/** Who already uses this username or email (another user than `userId`). */
async function conflict(userId: string, username: string, email: string) {
  const other = await prisma.user.findFirst({
    where: { id: { not: userId }, OR: [{ username }, { email }] },
    select: { username: true },
  })
  if (!other) return null
  return other.username === username
    ? ({ field: "username", key: "usernameTaken" } as const)
    : ({ field: "email", key: "emailTaken" } as const)
}

export async function updateProfile(input: unknown): Promise<ProfileResult> {
  const session = await currentSession()
  if (!session) return { ok: false, error: "unauthorized" }
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, field: issue.path[0] as keyof ProfileInput, key: issue.message as ValidationKey }
  }

  // Same storage as Better Auth: lowercase username (unique) + the typed case.
  const userId = session.user.id
  const displayUsername = parsed.data.username
  const username = displayUsername.toLowerCase()
  const email = parsed.data.email.toLowerCase()

  const taken = await conflict(userId, username, email)
  if (taken) return { ok: false, ...taken }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        displayUsername,
        name: displayUsername,
        email,
        // A new address has not been checked (42 had checked the old one).
        ...(email !== session.user.email && { emailVerified: false }),
      },
    })
  } catch (error) {
    // Someone took the name / email between the check and the update.
    if ((error as { code?: string }).code === "P2002") {
      const now = await conflict(userId, username, email)
      return { ok: false, ...(now ?? { field: "username", key: "usernameTaken" }) }
    }
    throw error
  }
  refresh()
  return { ok: true }
}

/** First bytes of each accepted type (a renamed .exe is not an image). */
function looksLike(mimeType: string, bytes: Uint8Array) {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b)
  const ascii = (at: number, text: string) =>
    [...text].every((c, i) => bytes[at + i] === c.charCodeAt(0))
  switch (mimeType) {
    case "image/png":
      return starts(0x89, 0x50, 0x4e, 0x47)
    case "image/jpeg":
      return starts(0xff, 0xd8, 0xff)
    case "image/gif":
      return ascii(0, "GIF8")
    case "image/webp":
      return ascii(0, "RIFF") && ascii(8, "WEBP")
    default:
      return false
  }
}

export async function uploadAvatar(formData: FormData): Promise<AvatarResult> {
  const session = await currentSession()
  if (!session) return { ok: false, error: "unauthorized" }
  const parsed = avatarSchema.safeParse(formData.get("avatar"))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message as ValidationKey }

  const file = parsed.data
  const data = new Uint8Array(await file.arrayBuffer())
  if (!looksLike(file.type, data)) return { ok: false, error: "avatarType" }

  const userId = session.user.id
  await prisma.$transaction([
    prisma.avatar.upsert({
      where: { userId },
      create: { userId, data, mimeType: file.type },
      update: { data, mimeType: file.type },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { image: `/api/avatar/${userId}?v=${Date.now()}` },
    }),
  ])
  refresh()
  return { ok: true }
}

/** Back to the default avatar (the initials). */
export async function removeAvatar(): Promise<AvatarResult> {
  const session = await currentSession()
  if (!session) return { ok: false, error: "unauthorized" }
  const userId = session.user.id
  await prisma.$transaction([
    prisma.avatar.deleteMany({ where: { userId } }),
    prisma.user.update({ where: { id: userId }, data: { image: null } }),
  ])
  refresh()
  return { ok: true }
}
