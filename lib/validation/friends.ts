import { z } from "zod"

import { usernameSchema } from "@/lib/validation/auth"

// Friend requests: same rules client and server (lib/actions/friends.ts).

export const addFriendSchema = z.object({ username: usernameSchema })
export const friendshipIdSchema = z.coerce.number().int().positive()

export type AddFriendInput = z.infer<typeof addFriendSchema>
