import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { NetworkStatus } from "@/components/layout/network-status"
import { Notifications } from "@/components/layout/notifications"
import { SearchCommand } from "@/components/layout/search"
import { SubscriptionBadge } from "@/components/layout/subscription-badge"
import { Preloader } from "@/components/layout/preloader"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { UserButton } from "@clerk/nextjs"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="min-w-0 max-w-full overflow-x-hidden">
        <Suspense fallback={null}>
          <Preloader />
        </Suspense>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-50">
          <SidebarTrigger className="-ml-1" />
          
          
          <div className="flex-1">
            <SearchCommand />
          </div>
          <div className="flex items-center gap-1">
            <NetworkStatus />
            <SubscriptionBadge />
            <Notifications />
            <ThemeToggle />
            
            <UserButton />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
