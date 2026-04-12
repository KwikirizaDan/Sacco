"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckCircle, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  saccoId: string
  adminName: string
  initialData?: {
    name: string | null
    code: string | null
    contact_email: string | null
    contact_phone: string | null
    address: string | null
    website: string | null
    registration_number: string | null
    primary_color: string | null
  } | null
}

export function OnboardingWizard({ saccoId, adminName, initialData }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    code: initialData?.code ?? "",
    contact_email: initialData?.contact_email ?? "",
    contact_phone: initialData?.contact_phone ?? "",
    address: initialData?.address ?? "",
    website: initialData?.website ?? "",
    registration_number: initialData?.registration_number ?? "",
    primary_color: initialData?.primary_color ?? "#f97316",
  })

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleNext = () => {
    setError("")
    if (step === 1 && !form.name.trim()) {
      setError("SACCO name is required.")
      return
    }
    setStep((s) => Math.min(s + 1, 3))
  }

  const handleFinish = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saccoId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save")
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, title: "SACCO Details" },
    { id: 2, title: "Branding" },
    { id: 3, title: "Confirm" },
  ]

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                step > s.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : step === s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
              )}
            >
              {step > s.id ? <CheckCircle className="h-4 w-4" /> : s.id}
            </div>
            <span
              className={cn(
                "ml-2 hidden text-xs font-semibold sm:block",
                step === s.id ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.title}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px w-8 sm:w-12",
                  step > s.id ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>SACCO Information</CardTitle>
              <CardDescription>
                Hello {adminName}! Tell us about your SACCO.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>SACCO Name *</Label>
                  <Input
                    placeholder="e.g. Kirumya Community SACCO"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Short Code</Label>
                  <Input
                    placeholder="e.g. KCS"
                    value={form.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Registration Number</Label>
                  <Input
                    placeholder="e.g. URSB-2024-0001"
                    value={form.registration_number}
                    onChange={(e) => set("registration_number", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="info@mysacco.ug"
                    value={form.contact_email}
                    onChange={(e) => set("contact_email", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="+256 700 000 000"
                    value={form.contact_phone}
                    onChange={(e) => set("contact_phone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Address</Label>
                  <Input
                    placeholder="Kampala, Uganda"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Website (optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://mysacco.ug"
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Customise the look of your SACCO portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Primary Brand Colour</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-lg border border-input p-1"
                  />
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {form.primary_color}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Used for buttons, accents, and highlights
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Preview
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg"
                    style={{ background: form.primary_color }}
                  />
                  <div className="flex-1">
                    <div
                      className="h-3 w-32 rounded"
                      style={{ background: form.primary_color, opacity: 0.7 }}
                    />
                    <div className="mt-1.5 h-2 w-20 rounded bg-muted" />
                  </div>
                  <button
                    type="button"
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm"
                    style={{ background: form.primary_color }}
                  >
                    Button
                  </button>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>You&apos;re all set!</CardTitle>
              <CardDescription>
                Review your SACCO details before launching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="mb-3 rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="divide-y rounded-lg border text-sm">
                {[
                  ["SACCO Name", form.name],
                  ["Short Code", form.code || "—"],
                  ["Registration No.", form.registration_number || "—"],
                  ["Email", form.contact_email || "—"],
                  ["Phone", form.contact_phone || "—"],
                  ["Address", form.address || "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Brand Colour</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ background: form.primary_color }}
                    />
                    <span className="font-mono font-medium">
                      {form.primary_color}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        <CardFooter className="flex justify-between gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            disabled={step === 1 || loading}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={handleNext}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "🚀 Launch Dashboard"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
