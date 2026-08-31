"use client"

import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0C1100] text-white">
		<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
				<h1 className="mx-auto max-w-7xl text-6xl font-bold tracking-tight sm:text-8xl p-8 border-b">
          			Coming Soon...
        		</h1>
				<div className="flex items-center justify-center gap-3">
					<div className="mt-10">
						<Link href="/play" className="inline-block rounded-md bg-[#CBFF00] px-8 py-3 font-semibold text-[#0C1100] transition hover:bg-[#CBFF00]">
							Back
						</Link>
					</div>
				</div>
			</section>
    </ main>
  )
}
