"use client"

import Link from "next/link"
import { PlayScene } from "@/components/naval-scene"

export default function Home() {
  return (
  <main className="min-h-screen bg-[#0C1100] text-white">
    {/* Header */}

    <section className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="mx-auto max-w-7xl border-b p-8 text-6xl font-bold tracking-tight sm:text-8xl">
        Select a game mode
      </h1>

      <div className="flex items-center justify-center gap-3">
        <div className="mt-10">
          <Link
            href="/play/solo"
            className="inline-block rounded-md bg-[#CBFF00] px-8 py-3 font-semibold text-[#0C1100] transition hover:text-white"
          >
            Solo
          </Link>
        </div>

        <div className="mt-10">
          <Link
            href="/play/online"
            className="inline-block rounded-md bg-[#CBFF00] px-8 py-3 font-semibold text-[#0C1100] transition hover:text-white"
          >
            Online
          </Link>
        </div>

        <div className="mt-10">
          <Link
            href="/play/tournament"
            className="inline-block rounded-md bg-[#CBFF00] px-8 py-3 font-semibold text-[#0C1100] transition hover:text-white"
          >
            Tournament
          </Link>
        </div>
      </div>
    </section>

    {/* Background */}
    <div className="pointer-events-none absolute inset-0 z-0">
      <PlayScene />
    </div>
  </main>
  )
}
