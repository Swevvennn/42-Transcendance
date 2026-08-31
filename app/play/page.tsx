"use client"

import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0C1100] text-white">
		{/* <div className="absolute inset-0 bg-[url('/images.jpg')] bg-cover bg-center bg-no-repeat left-0 right-0 top-0"> */}
			{/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.5)_25%,rgba(2,6,23,0.75)_50%,rgb(2,6,23)_75%))] "> */}
			<section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
				<h1 className="mx-auto max-w-7xl text-6xl font-bold tracking-tight sm:text-8xl p-8 border-b">
          			Select a game mode
        		</h1>
				<div className="flex items-center justify-center gap-3">
					<div className="mt-10">
						<Link href="/play/solo" className="inline-block rounded-md bg-[#CBFF00] px-8 py-3 font-semibold text-[#0C1100] transition hover:text-white">
							Solo
						</Link>
					</div>
					<div className="mt-10">
						<Link href="/play/online" className="inline-block rounded-md bg-[#CBFF00] px-8 py-3 font-semibold text-[#0C1100] transition hover:text-white">
							Online
						</Link>
					</div>
					<div className="mt-10">
						<Link href="/play/tournament" className="inline-block rounded-md bg-[#CBFF00] px-8 py-3 font-semibold text-[#0C1100] transition hover:text-white">
							Tournament
						</Link>
					</div>
				</div>
			</section>
			{/* </div>
		</div> */}
    </ main>
  )
}
