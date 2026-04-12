import type { Metadata } from "next"
import { LoginForm } from "./login-form"
export const metadata: Metadata = { title: "Sign In — SACCO Manager" }

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            SACCO Manager
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={1.5}
              className="h-10 w-10"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            SACCO Manager
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            Manage your SACCO members, loans, savings, and finances — all in one
            powerful offline-first platform.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Members", icon: "👥" },
              { label: "Loans", icon: "💰" },
              { label: "Savings", icon: "🏦" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm"
              >
                <div className="mb-1 text-2xl">{item.icon}</div>
                <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
