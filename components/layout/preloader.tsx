"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function Preloader() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="flex aspect-square size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-lg animate-bounce">
          S
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Loading...</p>
      </div>
    </div>
  )
}