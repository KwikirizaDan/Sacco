import { db } from "@/db"
import {
  members,
  loans,
  savingsAccounts,
  fines,
  transactions,
} from "@/db/schema"
import { count, sum, eq, desc } from "drizzle-orm"
import { KpiCards } from "./components/kpi-cards"
import { SavingsLoanChart } from "./components/savings-loan-chart"
import { LoanStatusChart } from "./components/loan-status-chart"
import { RecentTransactions } from "./components/recent-transactions"

export default async function DashboardPage() {
  // Run all queries in parallel for maximum performance
  const [
    totalMembersResult,
    activeLoansResult,
    totalSavingsResult,
    pendingFinesResult,
    totalDisbursedResult,
    pendingLoansResult,
    recentTransactions,
    loanStatusData,
  ] = await Promise.all([
    db.select({ count: count() }).from(members),
    db.select({ count: count() }).from(loans).where(eq(loans.status, "active")),
    db.select({ total: sum(savingsAccounts.balance) }).from(savingsAccounts),
    db
      .select({ count: count() })
      .from(fines)
      .where(eq(fines.status, "pending")),
    db
      .select({ total: sum(loans.amount) })
      .from(loans)
      .where(eq(loans.status, "active")),
    db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, "pending")),
    db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        narration: transactions.narration,
        created_at: transactions.created_at,
      })
      .from(transactions)
      .orderBy(desc(transactions.created_at))
      .limit(8),
    db
      .select({
        status: loans.status,
        count: count(),
      })
      .from(loans)
      .groupBy(loans.status),
  ])

  const totalMembers = totalMembersResult[0]
  const activeLoans = activeLoansResult[0]
  const totalSavings = totalSavingsResult[0]
  const pendingFines = pendingFinesResult[0]
  const totalDisbursed = totalDisbursedResult[0]
  const pendingLoans = pendingLoansResult[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here's what's happening with your SACCO.
        </p>
      </div>

      <KpiCards
        totalMembers={totalMembers.count}
        activeLoans={activeLoans.count}
        totalSavings={Number(totalSavings.total ?? 0)}
        pendingFines={pendingFines.count}
        totalDisbursed={Number(totalDisbursed.total ?? 0)}
        pendingLoans={pendingLoans.count}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SavingsLoanChart />
        </div>
        <div>
          <LoanStatusChart loanStatusData={loanStatusData} />
        </div>
      </div>

      <RecentTransactions transactions={recentTransactions} />
    </div>
  )
}
