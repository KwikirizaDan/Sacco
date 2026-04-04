// app/(dashboard)/loans/page.tsx
import { getAllLoans } from "@/db/queries/loans"
import { getAllMembers } from "@/db/queries/members"
import { getActiveInterestRates } from "@/db/queries/interest-rates"
import { LoansClient } from "./components/loans-client"
import type { Loan } from "@/db/schema"

export const dynamic = "force-dynamic"

export default async function LoansPage() {
  // Fetch data in parallel for faster loading
  const [loans, members, interestRates] = await Promise.all([
    getAllLoans(),
    getAllMembers(),
    getActiveInterestRates(),
  ])

  // Calculate statistics
  const totalDisbursed = loans
    .filter((l: Loan) => ["disbursed", "active", "settled"].includes(l.status))
    .reduce((sum: number, l: Loan) => sum + l.amount, 0)

  const outstandingBalance = loans
    .filter((l: Loan) => ["disbursed", "active"].includes(l.status))
    .reduce((sum: number, l: Loan) => sum + l.balance, 0)

  const stats = {
    totalDisbursed,
    totalLoans: loans.length,
    activeLoans: loans.filter((l: Loan) => l.status === "active").length,
    pendingLoans: loans.filter((l: Loan) => l.status === "pending").length,
    settledLoans: loans.filter((l: Loan) => l.status === "settled").length,
    outstandingBalance,
  }

  // Enrich loans with member names
  const loansWithMembers = loans.map((loan: Loan) => {
    const member = members.find((m) => m.id === loan.member_id)
    return {
      ...loan,
      member_name: member?.full_name || "Unknown",
      member_code: member?.member_code || "N/A",
    }
  })

  return (
    <div className="space-y-6">
      <LoansClient
        loans={loansWithMembers}
        members={members}
        stats={stats}
        interestRates={interestRates}
      />
    </div>
  )
}
