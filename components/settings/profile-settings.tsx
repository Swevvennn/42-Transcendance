"use client"

import { useTranslations } from "next-intl"
import { useRef, useState } from "react"

import { useFormErrors } from "@/components/auth/use-form-errors"
import { UserAvatar } from "@/components/profile/user-avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRouter } from "@/i18n/navigation"
import { removeAvatar, updateProfile, uploadAvatar, type AvatarResult } from "@/lib/actions/profile"
import { useSession } from "@/lib/auth-client"
import { connectAs, disconnect } from "@/lib/pong/connection"
import type { ValidationKey } from "@/lib/validation/auth"
import {
  AVATAR_SIZE,
  AVATAR_TYPES,
  avatarSchema,
  avatarSourceSchema,
  profileSchema,
  type ProfileInput,
} from "@/lib/validation/profile"

type User = { id: string; name: string; username: string; email: string; image: string | null }

/** The header (useSession) and the game connection show the new name/picture. */
function useRefreshUser() {
  const router = useRouter()
  const { refetch } = useSession()
  return async (userId: string, reconnect: boolean) => {
    router.refresh()
    await refetch()
    // The game server reads the name once, when the socket connects.
    if (reconnect) {
      disconnect()
      connectAs(userId)
    }
  }
}

// --- Avatar ------------------------------------------------------------------

/** Center-crops the picture to a square and resizes it (smaller upload). */
async function resize(file: File): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const side = Math.min(bitmap.width, bitmap.height)
    const canvas = document.createElement("canvas")
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    canvas.getContext("2d")?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE
    )
    bitmap.close()
    // WebP when the browser can encode it, PNG otherwise.
    const blob = await new Promise<Blob | null>((done) =>
      canvas.toBlob(done, "image/webp", 0.9)
    )
    if (!blob) return null
    return new File([blob], `avatar.${blob.type.split("/")[1]}`, { type: blob.type })
  } catch {
    return null // not a picture the browser can read
  }
}

export function AvatarSettings({ user }: { user: User }) {
  const t = useTranslations("Settings.avatar")
  const tv = useTranslations("Validation")
  const te = useTranslations("Settings.errors")
  const refreshUser = useRefreshUser()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<"saved" | "removed" | null>(null)
  const [error, setError] = useState<AvatarResult & { ok: false } | null>(null)

  async function run(action: () => Promise<AvatarResult>, done: "saved" | "removed") {
    setPending(true)
    let result: AvatarResult
    try {
      result = await action()
    } catch {
      result = { ok: false, error: "invalid" }
    }
    setPending(false)
    if (!result.ok) return setError(result)
    setMessage(done)
    await refreshUser(user.id, false)
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = "" // choosing the same file again fires a new change
    setError(null)
    setMessage(null)
    if (!file) return

    const source = avatarSourceSchema.safeParse(file)
    if (!source.success) {
      return setError({ ok: false, error: source.error.issues[0].message as ValidationKey })
    }
    const resized = await resize(file)
    const checked = avatarSchema.safeParse(resized)
    if (!checked.success) {
      return setError({ ok: false, error: checked.error.issues[0].message as ValidationKey })
    }
    const form = new FormData()
    form.set("avatar", checked.data)
    await run(() => uploadAvatar(form), "saved")
  }

  const errorText =
    error && (error.error === "unauthorized" || error.error === "invalid"
      ? te(error.error)
      : tv(error.error))

  return (
    <div className="flex flex-wrap items-center gap-4">
      <UserAvatar name={user.name} image={user.image} className="size-20 text-xl" />
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={AVATAR_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-label={t("upload")}
            onChange={onFile}
          />
          <Button type="button" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? t("uploading") : t("upload")}
          </Button>
          {user.image && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setError(null)
                setMessage(null)
                run(removeAvatar, "removed")
              }}
            >
              {t("remove")}
            </Button>
          )}
        </div>
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {t(message)}
          </p>
        )}
        {errorText && (
          <p role="alert" className="text-sm text-destructive">
            {errorText}
          </p>
        )}
      </div>
    </div>
  )
}

// --- Username and email ----------------------------------------------------

export function ProfileForm({ user }: { user: User }) {
  const t = useTranslations("Settings.profile")
  const te = useTranslations("Settings.errors")
  const tAuth = useTranslations("Auth")
  const refreshUser = useRefreshUser()
  const { errors, validate, errorFor, setFieldError } = useFormErrors<ProfileInput>(profileSchema)
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<"unauthorized" | "invalid" | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    setError(null)
    const data = validate(Object.fromEntries(new FormData(event.currentTarget)))
    if (!data) return

    setPending(true)
    try {
      // The server validates again with profileSchema.
      const result = await updateProfile(data)
      if (result.ok) {
        setSaved(true)
        await refreshUser(user.id, data.username !== user.name)
      } else if ("field" in result) {
        setFieldError(result.field, result.key)
      } else {
        setError(result.error)
      }
    } catch {
      setError("invalid")
    }
    setPending(false)
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="profile-username">{tAuth("signup.username")}</FieldLabel>
          <Input
            id="profile-username"
            name="username"
            defaultValue={user.name}
            autoComplete="username"
            aria-invalid={!!errors.username}
          />
          <FieldError>{errorFor("username")}</FieldError>
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="profile-email">{tAuth("email")}</FieldLabel>
          <Input
            id="profile-email"
            name="email"
            type="email"
            defaultValue={user.email}
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          <FieldError>{errorFor("email")}</FieldError>
        </Field>
        <Button type="submit" className="w-fit" disabled={pending}>
          {t("save")}
        </Button>
        {saved && (
          <p role="status" className="text-sm text-muted-foreground">
            {t("saved")}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {te(error)}
          </p>
        )}
      </FieldGroup>
    </form>
  )
}
