import { requireAuth } from "@/lib/auth"
import {
  getAllSavingsAccounts,
  getSavingsStats,
  getMembersForSavings,
  getSavingsCategoriesForSelect,
} from "@/db/queries/savings"
import { db } from "@/db"
import { loans } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { SavingsClient } from "./components/savings-client"

export default async function SavingsPage() {
  const user = await requireAuth()
  const [accounts, stats, membersForSelect, categories, activeLoans] =
    await Promise.all([
      getAllSavingsAccounts(user.saccoId),
      getSavingsStats(user.saccoId),
      getMembersForSavings(user.saccoId),
      getSavingsCategoriesForSelect(user.saccoId),
      db
        .select({
          id: loans.id,
          loan_ref: loans.loan_ref,
          balance: loans.balance,
          member_id: loans.member_id,
        })
        .from(loans)
        .where(
          and(eq(loans.status, "active"), eq(loans.sacco_id, user.saccoId))
        ),
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
