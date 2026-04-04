import { requireMobileAuth } from "@/lib/mobile-session"
import { db } from "@/db"
import { savingsAccounts, savingsCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { MobileStatusBar, MobilePageHeader } from "../components/mobile-ui"
import { MobileWithdrawClient } from "./mobile-withdraw-client"

export default async function MobileWithdrawPage() {
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

  // Filter: only regular (non-fixed) unlocked accounts for withdrawal
  const withdrawable = accounts.filter(
    (a) => a.account_type === "regular" && !a.is_locked
  )

  return (
    <div style={{ background: "#0f1623", minHeight: "100dvh" }}>
      <MobileStatusBar />
      <MobilePageHeader title="Withdraw Cash" subtitle="Withdraw from your savings" back />
      <MobileWithdrawClient accounts={accounts} withdrawableAccounts={withdrawable} />
    </div>
  )
}
