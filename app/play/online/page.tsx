"use client"

import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
		<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
				<h1 className="mx-auto max-w-7xl text-6xl font-bold tracking-tight sm:text-8xl p-8 border-b">
          			Coming Soon...
        		</h1>
				<div className="flex items-center justify-center gap-3">
					<div className="mt-10">
						<Link href="/play" className="inline-block rounded-md bg-cyan-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
							Back
						</Link>
					</div>
				</div>
			</section>
    </ main>
  )
}
