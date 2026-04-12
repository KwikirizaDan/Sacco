import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { getCurrentUser, checkOnboarding } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Bell, Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import "./globals.css"

function ClientHeader({ user }: { user: { role: string } }) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1" />
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
      </Button>
      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        <ThemeIcon className="h-5 w-5" />
      </Button>
      <span
        className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          ROLE_BADGE[user.role] ?? ROLE_BADGE.field_agent,
        ].join(" ")}
      >
        {ROLE_LABELS[user.role] ?? user.role}
      </span>
    </header>
  )
}

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
          <ClientHeader user={user} />
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
