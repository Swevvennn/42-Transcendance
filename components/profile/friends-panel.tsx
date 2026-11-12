"use client"

import { useTranslations } from "next-intl"
import { useRef, useState } from "react"

import { useFormErrors } from "@/components/auth/use-form-errors"
import { UserAvatar } from "@/components/profile/user-avatar"
import { useFriendAction } from "@/components/profile/use-friend-action"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from "@/lib/actions/friends"
import type { UserStatus } from "@/lib/presence"
import { addFriendSchema, type AddFriendInput } from "@/lib/validation/friends"

type Friend = {
  friendshipId: number
  name: string
  username: string | null
  image: string | null
  status: UserStatus
}

/** Friends list + requests + "add a friend" form (own profile only). */
export function FriendsPanel({
  friends,
  received,
  sent,
}: {
  friends: Friend[]
  received: Friend[]
  sent: Friend[]
}) {
  const t = useTranslations("Profile.friends")
  const { pending, error, run } = useFriendAction()
  const { errors, validate, errorFor } = useFormErrors<AddFriendInput>(addFriendSchema)
  const [sentOk, setSentOk] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSentOk(false)
    const data = validate(Object.fromEntries(new FormData(event.currentTarget)))
    if (!data) return
    run(
      () => sendFriendRequest(data),
      () => {
        setSentOk(true)
        formRef.current?.reset()
      }
    )
  }

  const row = (friend: Friend, actions: React.ReactNode) => (
    <li key={friend.friendshipId} className="flex items-center gap-2">
      <UserAvatar name={friend.name} image={friend.image} size="sm" />
      {friend.username ? (
        <Link href={`/profile/${friend.username}`} className="flex-1 truncate text-sm hover:underline">
          {friend.name}
        </Link>
      ) : (
        <span className="flex-1 truncate text-sm">{friend.name}</span>
      )}
      {actions}
    </li>
  )

  return (
    <div className="flex flex-col gap-4">
      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {friends.map((f) =>
            row(
              f,
              <>
                <StatusBadge status={f.status} />
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={pending}
                  onClick={() => run(() => removeFriendship(f.friendshipId))}
                >
                  {t("remove")}
                </Button>
              </>
            )
          )}
        </ul>
      )}

      {received.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{t("received")}</h3>
          <ul className="flex flex-col gap-2">
            {received.map((f) =>
              row(
                f,
                <>
                  <Button size="xs" disabled={pending} onClick={() => run(() => acceptFriendRequest(f.friendshipId))}>
                    {t("accept")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={pending}
                    onClick={() => run(() => removeFriendship(f.friendshipId))}
                  >
                    {t("decline")}
                  </Button>
                </>
              )
            )}
          </ul>
        </section>
      )}

      {sent.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{t("sent")}</h3>
          <ul className="flex flex-col gap-2">
            {sent.map((f) =>
              row(
                f,
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={pending}
                  onClick={() => run(() => removeFriendship(f.friendshipId))}
                >
                  {t("cancel")}
                </Button>
              )
            )}
          </ul>
        </section>
      )}

      <Separator />

      <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="friend-username">{t("add")}</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="friend-username"
              name="username"
              autoComplete="off"
              aria-invalid={!!errors.username}
            />
            <Button type="submit" disabled={pending}>
              {t("send")}
            </Button>
          </div>
          <FieldError>{errorFor("username")}</FieldError>
        </Field>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {t(`errors.${error}`)}
          </p>
        )}
        {sentOk && !error && <p className="text-xs text-muted-foreground">{t("sentOk")}</p>}
      </form>
    </div>
  )
}
