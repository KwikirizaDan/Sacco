import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-session"
import { db } from "@/db"
import { savingsAccounts, transactions, members, notifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"

export async function POST(req: Request) {
  try {
    const session = await getMobileSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { account_id, amount, payment_method, narration } = await req.json()
    if (!account_id || !amount || amount < 100000) {
      return NextResponse.json({ error: "Minimum deposit is UGX 1,000" }, { status: 400 })
    }

    const [account] = await db.select().from(savingsAccounts).where(eq(savingsAccounts.id, account_id))
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })
    if (account.member_id !== session.memberId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    if (account.is_locked) return NextResponse.json({ error: "Account is locked" }, { status: 400 })

    const newBalance = account.balance + amount

    await db.update(savingsAccounts).set({ balance: newBalance, updated_at: new Date() }).where(eq(savingsAccounts.id, account_id))

    await db.insert(transactions).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      type: "savings_deposit",
      amount,
      balance_after: newBalance,
      reference_id: account_id,
      narration: narration || "Mobile deposit",
      payment_method: (payment_method as any) || "cash",
    })

    const [member] = await db.select().from(members).where(eq(members.id, session.memberId))

    // Admin notification
    await db.insert(notifications).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      title: "Savings Deposit",
      body: `${member?.full_name} (${member?.member_code}) deposited UGX ${(amount / 100).toLocaleString()} via ${payment_method}. New balance: UGX ${(newBalance / 100).toLocaleString()}.`,
      type: "in_app",
      status: "sent",
      priority: "normal",
      channel: "in_app",
      reference_type: "savings",
      sent_at: new Date(),
    })

    if (member?.phone) {
      await sendSms({
        to: member.phone,
        message: `Dear ${member.full_name}, deposit of UGX ${(amount / 100).toLocaleString()} received. New savings balance: UGX ${(newBalance / 100).toLocaleString()}. Account: ${account.account_number}. - SACCO`,
      })
    }

    return NextResponse.json({ success: true, newBalance })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Deposit failed" }, { status: 500 })
  }
}
