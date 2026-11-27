"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { useFormErrors } from "@/components/auth/use-form-errors"
import { ButtonLink } from "@/components/button-link"
import { OnlineGate } from "@/components/online/online-gate"
import { SwissSection } from "@/components/swiss-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useRouter } from "@/i18n/navigation"
import type { GameSocket } from "@/lib/pong/connection"
import type { ErrorCode, TournamentSummary } from "@/lib/pong/protocol"
import { tournamentFormSchema, type TournamentFormInput } from "@/lib/validation/game"

export function TournamentList() {
  return (
    <OnlineGate>
      {({ socket }) => (
        <div className="flex flex-col gap-10">
          <CreateTournament socket={socket} />
          <OpenTournaments socket={socket} />
        </div>
      )}
    </OnlineGate>
  )
}

function CreateTournament({ socket }: { socket: GameSocket }) {
  const t = useTranslations("Tournament")
  const router = useRouter()
  const { errors, validate, errorFor } =
    useFormErrors<TournamentFormInput>(tournamentFormSchema)
  const [error, setError] = useState<ErrorCode | null>(null)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = validate(Object.fromEntries(new FormData(event.currentTarget)))
    if (!data) return
    // The server validates again with tournamentFormSchema.
    socket.emit("tournament:create", data, (res) => {
      if (res.ok) router.push(`/play/tournament/${res.id}`)
      else setError(res.error)
    })
  }

  return (
    <SwissSection title={t("create.title")}>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">{t("create.name")}</FieldLabel>
              <Input id="name" name="name" aria-invalid={!!errors.name} />
              <FieldError>{errorFor("name")}</FieldError>
            </Field>
            <Field data-invalid={!!errors.maxPlayers}>
              <FieldLabel htmlFor="maxPlayers">{t("create.size")}</FieldLabel>
              <NativeSelect
                id="maxPlayers"
                name="maxPlayers"
                defaultValue="4"
                className="w-full"
                aria-invalid={!!errors.maxPlayers}
              >
                <NativeSelectOption value="4">4</NativeSelectOption>
                <NativeSelectOption value="8">8</NativeSelectOption>
              </NativeSelect>
              <FieldError>{errorFor("maxPlayers")}</FieldError>
            </Field>
            <Button type="submit">{t("create.submit")}</Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {t(`errors.${error}`)}
              </p>
            )}
          </FieldGroup>
        </form>
    </SwissSection>
  )
}

function OpenTournaments({ socket }: { socket: GameSocket }) {
  const t = useTranslations("Tournament")
  const [list, setList] = useState<TournamentSummary[] | null>(null)

  useEffect(() => {
    // Get the list now, then receive every change live.
    socket.emit("tournament:subscribeList", setList)
    socket.on("tournament:list", setList)
    return () => {
      socket.off("tournament:list", setList)
      socket.emit("tournament:unsubscribeList")
    }
  }, [socket])

  return (
    <SwissSection title={t("list.title")}>
      {list?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
      )}
      <ul className="flex flex-col">
        {list?.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border py-3"
          >
            <div className="flex min-w-0 flex-col">
              <span className="font-semibold">{item.name}</span>
              <span className="text-sm text-muted-foreground">
                {t("list.players", { count: item.playerCount, max: item.maxPlayers })}
                {" · "}
                {t("list.host", { name: item.hostName })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={item.status === "lobby" ? "default" : "outline"}>
                {t(`status.${item.status}`)}
              </Badge>
              <ButtonLink href={`/play/tournament/${item.id}`} variant="outline" size="sm">
                {t("list.open")}
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>
    </SwissSection>
  )
}
