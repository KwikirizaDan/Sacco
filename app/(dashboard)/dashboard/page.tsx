import { db } from "@/db"
import {
  members,
  loans,
  savingsAccounts,
  fines,
  transactions,
} from "@/db/schema"
import { count, sum, eq, desc, and, sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"
import { KpiCards } from "./components/kpi-cards"
import { SavingsLoanChart } from "./components/savings-loan-chart"
import { LoanStatusChart } from "./components/loan-status-chart"
import { RecentTransactions } from "./components/recent-transactions"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    // Handle unauthenticated user - redirect to login
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }

  const { email, saccoId } = user!
  console.log("Current user:", { email, saccoId })

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
    savingsLoanChartData,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(members)
      .where(eq(members.sacco_id, saccoId)),
    db
      .select({ count: count() })
      .from(loans)
      .where(and(eq(loans.status, "active"), eq(loans.sacco_id, saccoId))),
    db
      .select({ total: sum(savingsAccounts.balance) })
      .from(savingsAccounts)
      .where(eq(savingsAccounts.sacco_id, saccoId)),
    db
      .select({ count: count() })
      .from(fines)
      .where(and(eq(fines.status, "pending"), eq(fines.sacco_id, saccoId))),
    db
      .select({ total: sum(loans.amount) })
      .from(loans)
      .where(and(eq(loans.status, "active"), eq(loans.sacco_id, saccoId))),
    db
      .select({ count: count() })
      .from(loans)
      .where(and(eq(loans.status, "pending"), eq(loans.sacco_id, saccoId))),
    db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        narration: transactions.narration,
        created_at: transactions.created_at,
      })
      .from(transactions)
      .where(eq(transactions.sacco_id, saccoId))
      .orderBy(desc(transactions.created_at))
      .limit(8),
    db
      .select({
        status: loans.status,
        count: count(),
      })
      .from(loans)
      .where(eq(loans.sacco_id, saccoId))
      .groupBy(loans.status),
    db
      .select({
        month: sql<string>`TO_CHAR(transactions.created_at, 'Mon')`,
        savings: sql<number>`COALESCE(SUM(CASE WHEN transactions.type = 'savings_deposit' THEN transactions.amount ELSE 0 END), 0)`,
        loans: sql<number>`COALESCE(SUM(CASE WHEN transactions.type = 'loan_disbursement' THEN transactions.amount ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.sacco_id, saccoId))
      .groupBy(sql`TO_CHAR(transactions.created_at, 'Mon')`)
      .orderBy(desc(sql`TO_CHAR(transactions.created_at, 'Mon')`))
      .limit(6),
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
          Welcome back! Here&apos;s what&apos;s happening with your SACCO.
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
          <SavingsLoanChart data={savingsLoanChartData} />
        </div>
        <div>
          <LoanStatusChart loanStatusData={loanStatusData} />
        </div>
      </div>

      <RecentTransactions transactions={recentTransactions} />
    </div>
  )
}
