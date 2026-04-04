import {
  getAllSavingsAccounts,
  getSavingsStats,
  getMembersForSavings,
  getSavingsCategoriesForSelect,
} from "@/db/queries/savings"
import { db } from "@/db"
import { loans } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { SavingsClient } from "./components/savings-client"

export const dynamic = "force-dynamic"

export default async function SavingsPage() {
  const [accounts, stats, membersForSelect, categories, activeLoans] =
    await Promise.all([
      getAllSavingsAccounts(),
      getSavingsStats(),
      getMembersForSavings(),
      getSavingsCategoriesForSelect(),
      db
        .select({
          id: loans.id,
          loan_ref: loans.loan_ref,
          balance: loans.balance,
          member_id: loans.member_id,
        })
        .from(loans)
        .where(eq(loans.status, "active")),
    ])

  return (
    <SavingsClient
      accounts={accounts}
      stats={stats}
      members={membersForSelect}
      categories={categories}
      activeLoans={activeLoans}
    />
  )
}
