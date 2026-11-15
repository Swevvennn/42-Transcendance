"use client"

import { useState, useTransition } from "react"

import { useRouter } from "@/i18n/navigation"
import type { FriendErrorKey, FriendResult } from "@/lib/actions/friends"

/** Runs a friend server action, then reloads the server data of the page. */
export function useFriendAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<FriendErrorKey | null>(null)

  function run(action: () => Promise<FriendResult>, onOk?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) return setError(result.error)
      onOk?.()
      router.refresh()
    })
  }

  return { pending, error, run }
}
