// app/(dashboard)/loans/new/page.tsx
import { getMembersForSelect } from "@/db/queries/members"
import { getActiveInterestRates } from "@/db/queries/interest-rates"
import { NewLoanForm } from "./new-loan-form"

export default async function NewLoanPage() {
  const members = await getMembersForSelect()
  const interestRates = await getActiveInterestRates()

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Loan Application</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to submit a new loan application. Interest rates will be automatically applied based on the loan amount.
        </p>
      </div>
      <NewLoanForm members={members} interestRates={interestRates} />
    </div>
  )
}
