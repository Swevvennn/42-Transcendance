import Image from "next/image";
import Warship from "@/components/warship";
import Link from "next/link"

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0C1100] text-white">
	  <div className="absolute inset-0">
		<Warship />
	  </div>
      {/* Hero */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-[#CBFF00]">
          Naval Battle Arena
        </div>

        <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">
          TRANSCENDENCE
        </h1>

        <p className="mt-6 max-w-xl text-lg text-grey">
          Deploy your fleet. Read the enemy waters. Sink their ships.
          <br />
          Only one commander leaves victorious.
        </p>

        <div className="mt-10">
          <Link
            href="/play"
            className="inline-block rounded-md bg-[#CBFF00] px-8 py-3 font-semibold text-[#0C1100] transition hover:text-white"
          >
            Play Now
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-grey pt-8 text-sm">
          <div>
            <p className="text-2xl font-bold text-white">1v1</p>
            <p className="mt-1 text-grey">Battles</p>
          </div>

          <div>
            <p className="text-2xl font-bold text-white">10×10</p>
            <p className="mt-1 text-grey">Battle Grid</p>
          </div>

          <div>
            <p className="text-2xl font-bold text-white">∞</p>
            <p className="mt-1 text-grey">Battles</p>
          </div>
        </div>
      </section>
    </main>
  )
}
