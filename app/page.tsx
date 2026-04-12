import { redirect } from "next/navigation"
import { getCurrentUser, checkOnboarding } from "@/lib/auth"

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")
  const { needsOnboarding } = await checkOnboarding()
  if (needsOnboarding) redirect("/auth/onboarding")
  redirect("/dashboard")
}
