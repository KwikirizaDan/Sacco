import { requireMobileAuth } from "@/lib/mobile-session"
import { db } from "@/db"
import { savingsAccounts, savingsCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { MobileStatusBar, MobilePageHeader } from "../components/mobile-ui"
import { MobileDepositClient } from "./mobile-deposit-client"

export default async function MobileDepositPage() {
  const member = await requireMobileAuth()

  const accounts = await db
    .select({
      id: savingsAccounts.id,
      account_number: savingsAccounts.account_number,
      balance: savingsAccounts.balance,
      account_type: savingsAccounts.account_type,
      is_locked: savingsAccounts.is_locked,
      lock_until: savingsAccounts.lock_until,
      lock_reason: savingsAccounts.lock_reason,
      category_name: savingsCategories.name,
    })
    .from(savingsAccounts)
    .leftJoin(savingsCategories, eq(savingsAccounts.category_id, savingsCategories.id))
    .where(eq(savingsAccounts.member_id, member.id))

  return (
    <div style={{ background: "#0f1623", minHeight: "100dvh" }}>
      <MobileStatusBar />
      <MobilePageHeader title="Deposit Savings" subtitle="Add funds to your savings" back />
      <MobileDepositClient accounts={accounts} />
    </div>
  )
}
