import Image from "next/image";

import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
          Naval Battle Arena
        </div>

        <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">
          TRANSCENDENCE
        </h1>

        <p className="mt-6 max-w-xl text-lg text-slate-400">
          Deploy your fleet. Read the enemy waters. Sink their ships.
          <br />
          Only one commander leaves victorious.
        </p>

        <div className="mt-10">
          <Link
            href="/play"
            className="inline-block rounded-md bg-cyan-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Play Now
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-slate-800 pt-8 text-sm">
          <div>
            <p className="text-2xl font-bold text-white">1v1</p>
            <p className="mt-1 text-slate-500">Battles</p>
          </div>

          <div>
            <p className="text-2xl font-bold text-white">10×10</p>
            <p className="mt-1 text-slate-500">Battle Grid</p>
          </div>

          <div>
            <p className="text-2xl font-bold text-white">∞</p>
            <p className="mt-1 text-slate-500">Battles</p>
          </div>
        </div>
      </section>
    </main>
  )
}
