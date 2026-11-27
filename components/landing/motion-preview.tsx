"use client"

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react"
import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

// Wraps a landing preview with a toolbar; "Replay" remounts the landing so its
// CSS intro animations run again.
export function MotionPreview({
  toolbar,
  replayLabel,
  children,
}: {
  toolbar: ReactNode
  replayLabel: string
  children: ReactNode
}) {
  const [run, setRun] = useState(0)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm">
        {toolbar}
        <Button variant="outline" size="lg" className="h-9 px-3" onClick={() => setRun((n) => n + 1)}>
          <ArrowCounterClockwiseIcon aria-hidden />
          {replayLabel}
        </Button>
      </div>
      <div key={run}>{children}</div>
    </div>
  )
}
