import type { Metadata, Viewport } from "next"
import { MobileBottomNav } from "./components/mobile-bottom-nav"

export const metadata: Metadata = {
  title: "SACCO Member Portal",
  description: "SACCO member self-service mobile portal",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SACCO" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#0f1623",
        minHeight: "100dvh",
        maxWidth: "430px",
        margin: "0 auto",
        position: "relative",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <main style={{ paddingBottom: "72px" }}>{children}</main>
      <MobileBottomNav />
    </div>
  )
}
