"use client"

import { useTranslations } from "next-intl"

import { useFriendAction } from "@/components/profile/use-friend-action"
import { Button } from "@/components/ui/button"
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from "@/lib/actions/friends"
import type { FriendshipState } from "@/lib/users"

/** The friend button on someone else's profile. */
export function FriendButton({
  username,
  state,
  friendshipId,
}: {
  username: string
  state: FriendshipState
  friendshipId: number | null
}) {
  const t = useTranslations("Profile.friends")
  const { pending, error, run } = useFriendAction()

  let button
  switch (state) {
    case "none":
      button = (
        <Button onClick={() => run(() => sendFriendRequest({ username }))} disabled={pending}>
          {t("addFriend")}
        </Button>
      )
      break
    case "received":
      button = (
        <Button onClick={() => run(() => acceptFriendRequest(friendshipId))} disabled={pending}>
          {t("acceptRequest")}
        </Button>
      )
      break
    case "sent":
      button = (
        <Button variant="outline" onClick={() => run(() => removeFriendship(friendshipId))} disabled={pending}>
          {t("requestSent")} · {t("cancel")}
        </Button>
      )
      break
    case "friends":
      button = (
        <Button variant="outline" onClick={() => run(() => removeFriendship(friendshipId))} disabled={pending}>
          {t("removeFriend")}
        </Button>
      )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {button}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}
    </div>
  )
}
