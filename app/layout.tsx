import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "SACCO Manager",
  description:
    "A modern SACCO management application for loans, savings, and member management",
  manifest: "/manifest.json",
  applicationName: "SACCO Manager",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SACCO Manager",
  },
  icons: {
    icon: [
      { url: "/sacco_logo_dark.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/sacco_logo_dark.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/sacco_logo_dark.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      afterSignOutUrl="/sign-in"
      appearance={{
        variables: {
          colorPrimary: "#16a34a",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "shadow-none border border-border bg-background",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "border border-border bg-background hover:bg-muted text-foreground",
          formFieldInput: "border border-input bg-background text-foreground",
          footerActionLink: "text-primary hover:text/primary/80",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground",
        },
      }}
    >
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
                {children}
                <Toaster richColors position="top-right" />
              </ThemeProvider>
            </Suspense>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
