import { z } from "zod"

import { usernameSchema } from "@/lib/validation/auth"

// Profile settings: same rules client (components/settings/*) and server
// (lib/actions/profile.ts). Messages are keys under `Validation.*`.

export const profileSchema = z.object({
  username: usernameSchema,
  email: z.email({ error: "emailInvalid" }),
})

export type ProfileInput = z.infer<typeof profileSchema>

/** Image types accepted for an avatar (no SVG: it can contain scripts). */
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

/** Biggest picture the browser may pick (it is resized before upload). */
export const AVATAR_SOURCE_MAX_BYTES = 10 * 1024 * 1024
/** Biggest picture stored (after the 256x256 resize, it is ~20-60 KB). */
export const AVATAR_MAX_BYTES = 512 * 1024
/** Side of the square picture the browser sends. */
export const AVATAR_SIZE = 256

/** The file chosen in the browser, before resizing. */
export const avatarSourceSchema = z
  .file({ error: "avatarType" })
  .mime(AVATAR_TYPES, { error: "avatarType" })
  .max(AVATAR_SOURCE_MAX_BYTES, { error: "avatarSize" })

/** The resized file sent to the server (checked again there). */
export const avatarSchema = z
  .file({ error: "avatarType" })
  .mime(AVATAR_TYPES, { error: "avatarType" })
  .max(AVATAR_MAX_BYTES, { error: "avatarSize" })
