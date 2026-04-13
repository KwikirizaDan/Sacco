import {
  getSaccoSettings,
  getInterestRates,
  getLoanCategories,
  getSavingsCategories,
  getFineCategories,
} from "@/db/queries/settings"
import { getCurrentUser } from "@/lib/auth"
import { SettingsClient } from "./components/settings-client"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) {
    // Handle unauthenticated user - redirect to login
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }

  const { saccoId } = user!
  const [
    sacco,
    interestRates,
    loanCategories,
    savingsCategories,
    fineCategories,
  ] = await Promise.all([
    getSaccoSettings(saccoId),
    getInterestRates(saccoId),
    getLoanCategories(saccoId),
    getSavingsCategories(saccoId),
    getFineCategories(saccoId),
  ])

  return (
    <SettingsClient
      sacco={sacco}
      interestRates={interestRates}
      loanCategories={loanCategories}
      savingsCategories={savingsCategories}
      fineCategories={fineCategories}
    />
  )
}
