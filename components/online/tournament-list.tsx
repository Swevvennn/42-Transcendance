"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { useFormErrors } from "@/components/auth/use-form-errors"
import { ButtonLink } from "@/components/button-link"
import { OnlineGate } from "@/components/online/online-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
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
    <Card className="self-start">
      <CardHeader>
        <CardTitle>{t("create.title")}</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
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
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold">{t("list.title")}</h2>
      {list?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
      )}
      {list?.map((item) => (
        <Card key={item.id} size="sm">
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>
              {t("list.players", { count: item.playerCount, max: item.maxPlayers })}
              {" · "}
              {t("list.host", { name: item.hostName })}
            </CardDescription>
            <CardAction>
              <Badge variant={item.status === "lobby" ? "default" : "secondary"}>
                {t(`status.${item.status}`)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter>
            <ButtonLink href={`/play/tournament/${item.id}`} variant="outline" size="sm">
              {t("list.open")}
            </ButtonLink>
          </CardFooter>
        </Card>
      ))}
    </section>
  )
}
