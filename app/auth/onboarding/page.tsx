import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { db } from "@/db"
import { saccos } from "@/db/schema"
import { eq } from "drizzle-orm"
import { OnboardingWizard } from "./onboarding-wizard"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Setup Your SACCO — SACCO Manager" }

export default async function OnboardingPage() {
  const user = await requireRole("admin")

  const [sacco] = await db
    .select()
    .from(saccos)
    .where(eq(saccos.id, user.saccoId))
    .limit(1)

  if (sacco?.onboarding_completed) redirect("/dashboard")

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-6 w-6"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Welcome to SACCO Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let&apos;s set up your SACCO details. This only takes a minute.
          </p>
        </div>
        <OnboardingWizard
          saccoId={user.saccoId}
          initialData={sacco ?? undefined}
          adminName={user.fullName}
        />
      </div>
    </div>
  )
}
