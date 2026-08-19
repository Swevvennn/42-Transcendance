"use client"

import Image from "next/image";
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
		<header>

		</header>
		<br /><br />
		<div className="absolute inset-0 bg-[url('/images.jpg')] bg-cover bg-center bg-no-repeat ">
			<div className=" absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.5)_25%,rgba(2,6,23,0.75)_50%,rgb(2,6,23)_75%))]">
				<div className="ralative flex  min-h-screen items-center justify-center">
					<ButtonGroup>
						<ButtonGroup><Button variant="outline" size="lg">TEST</Button></ButtonGroup>
						<ButtonGroup><Button variant="outline" size="lg">TEST</Button></ButtonGroup>
					</ButtonGroup>
				</div>
			</div>
		</div>
    </ main>
  )
}
