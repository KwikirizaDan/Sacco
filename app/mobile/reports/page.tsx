import { requireMobileAuth } from "@/lib/mobile-session"
import { db } from "@/db"
import { transactions, savingsAccounts, loans, fines } from "@/db/schema"
import { eq, desc, sum, count } from "drizzle-orm"
import { MobileStatusBar, MobilePageHeader } from "../components/mobile-ui"
import { MobileReportsClient } from "./mobile-reports-client"

export default async function MobileReportsPage() {
  const member = await requireMobileAuth()

  const [savingsTotal] = await db.select({ total: sum(savingsAccounts.balance) }).from(savingsAccounts).where(eq(savingsAccounts.member_id, member.id))
  const [loansTotal] = await db.select({ total: sum(loans.balance) }).from(loans).where(eq(loans.member_id, member.id))
  const [finesTotal] = await db.select({ total: sum(fines.amount) }).from(fines).where(eq(fines.member_id, member.id))
  const [txCount] = await db.select({ count: count() }).from(transactions).where(eq(transactions.member_id, member.id))

  const allTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.member_id, member.id))
    .orderBy(desc(transactions.created_at))
    .limit(100)

  return (
    <div style={{ background: "#0f1623", minHeight: "100dvh" }}>
      <MobileStatusBar />
      <MobilePageHeader title="Reports" subtitle="Transaction history" />
      <MobileReportsClient
        member={{ full_name: member.full_name, member_code: member.member_code }}
        transactions={allTx}
        stats={{
          totalSavings: Number(savingsTotal?.total ?? 0),
          totalLoans: Number(loansTotal?.total ?? 0),
          totalFines: Number(finesTotal?.total ?? 0),
          txCount: txCount?.count ?? 0,
        }}
      />
    </div>
  )
}
