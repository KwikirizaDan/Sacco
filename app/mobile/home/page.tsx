import { requireMobileAuth } from "@/lib/mobile-session"
import { db } from "@/db"
import { savingsAccounts, loans, fines, transactions } from "@/db/schema"
import { eq, desc, sum, count } from "drizzle-orm"
import { MobileStatusBar, MobilePageHeader } from "../components/mobile-ui"
import { MobileHomeClient } from "./mobile-home-client"

export default async function MobileHomePage() {
  const member = await requireMobileAuth()

  const [savingsData] = await db
    .select({ total: sum(savingsAccounts.balance), accounts: count() })
    .from(savingsAccounts)
    .where(eq(savingsAccounts.member_id, member.id))

  const [loanData] = await db
    .select({ total: sum(loans.balance), active: count() })
    .from(loans)
    .where(eq(loans.member_id, member.id))

  const [fineData] = await db
    .select({ total: sum(fines.amount) })
    .from(fines)
    .where(eq(fines.member_id, member.id))

  const recentTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.member_id, member.id))
    .orderBy(desc(transactions.created_at))
    .limit(5)

  // Monthly savings + loans for line graph (last 6 months)
  const allSavingsTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.member_id, member.id))
    .orderBy(desc(transactions.created_at))
    .limit(100)

  const months: Record<string, { savings: number; loans: number }> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleString("default", { month: "short" })
    months[key] = { savings: 0, loans: 0 }
  }
  allSavingsTx.forEach((tx) => {
    if (!tx.created_at) return
    const key = new Date(tx.created_at).toLocaleString("default", { month: "short" })
    if (!months[key]) return
    if (tx.type === "savings_deposit") months[key].savings += tx.amount / 100
    if (tx.type === "loan_disbursement" || tx.type === "loan_repayment") months[key].loans += tx.amount / 100
  })
  const chartData = Object.entries(months).map(([month, v]) => ({ month, ...v }))

  return (
    <div style={{ background: "#0f1623", minHeight: "100dvh" }}>
      <MobileStatusBar />
      <MobileHomeClient
        member={{
          full_name: member.full_name,
          member_code: member.member_code,
          status: member.status,
        }}
        totalSavings={Number(savingsData?.total ?? 0)}
        activeLoans={Number(loanData?.total ?? 0)}
        pendingFines={Number(fineData?.total ?? 0)}
        transactions={recentTx}
        chartData={chartData}
      />
    </div>
  )
}
