import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { getCurrentUser, checkOnboarding } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ClientHeader } from "@/components/ui/client-header"
import "./globals.css"

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
