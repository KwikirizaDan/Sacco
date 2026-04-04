import {
  getSaccoSettings,
  getInterestRates,
  getLoanCategories,
  getSavingsCategories,
  getFineCategories,
} from "@/db/queries/settings"
import { SettingsClient } from "./components/settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const [
    sacco,
    interestRates,
    loanCategories,
    savingsCategories,
    fineCategories,
  ] = await Promise.all([
    getSaccoSettings(),
    getInterestRates(),
    getLoanCategories(),
    getSavingsCategories(),
    getFineCategories(),
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
