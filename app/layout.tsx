import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { getCurrentUser, checkOnboarding } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import "./globals.css"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  cashier: "Cashier",
  field_agent: "Field Agent",
}

const ROLE_BADGE: Record<string, string> = {
  admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  cashier: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  field_agent:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

export const metadata: Metadata = {
  title: { default: "SACCO Manager", template: "%s — SACCO Manager" },
  description: "Modern SACCO management",
  manifest: "/manifest.json",
  applicationName: "SACCO Manager",
  icons: { icon: [{ url: "/sacco_logo_dark.svg", type: "image/svg+xml" }] },
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  let body = children

  if (user) {
    const { needsOnboarding } = await checkOnboarding()
    if (needsOnboarding) {
      redirect("/auth/onboarding")
    }

    body = (
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1" />
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                ROLE_BADGE[user.role] ?? ROLE_BADGE.field_agent,
              ].join(" ")}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <QueryProvider>
          <Suspense fallback={null}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {body}
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  )
}
