import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-session"
import { db } from "@/db"
import {
  savingsAccounts,
  transactions,
  members,
  notifications,
} from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"
import { initiateFlutterwaveTransfer } from "@/lib/payments/flutterwave"

export async function POST(req: Request) {
  try {
    const session = await getMobileSession()
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { account_id, amount, payment_method, narration } = await req.json()

    const [account] = await db
      .select()
      .from(savingsAccounts)
      .where(eq(savingsAccounts.id, account_id))
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    if (account.member_id !== session.memberId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    if (account.is_locked)
      return NextResponse.json({ error: "Account is locked" }, { status: 400 })
    if (account.account_type === "fixed")
      return NextResponse.json(
        { error: "Cannot withdraw from a fixed deposit account" },
        { status: 400 }
      )
    if (account.balance < amount)
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      )

    const newBalance = account.balance - amount

    await db
      .update(savingsAccounts)
      .set({ balance: newBalance, updated_at: new Date() })
      .where(eq(savingsAccounts.id, account_id))

    await db.insert(transactions).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      type: "savings_withdrawal",
      amount,
      balance_after: newBalance,
      reference_id: account_id,
      narration: narration || "Mobile withdrawal",
      payment_method:
        payment_method === "mobile_money"
          ? "flutterwave"
          : (payment_method as any) || "cash",
    })

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, session.memberId))

    // Initiate Flutterwave transfer if mobile money
    if (payment_method === "mobile_money" && member?.phone) {
      try {
        const normalizedPhone = member.phone
          .replace(/\s+/g, "")
          .replace(/^\+/, "")
          .replace(/^0/, "256")
        const account_bank =
          normalizedPhone.startsWith("25675") ||
          normalizedPhone.startsWith("25670")
            ? "MPS"
            : "ATL"
        await initiateFlutterwaveTransfer({
          account_bank,
          account_number: normalizedPhone,
          amount: amount / 100,
          currency: "UGX",
          narration: narration || "Mobile withdrawal",
          reference: `MWD-${account_id}-${Date.now()}`,
          beneficiary_name: member.full_name,
        })
      } catch (transferError) {
        console.error(
          "[Mobile Withdraw] Flutterwave transfer failed:",
          transferError
        )
        // Still proceed
      }
    }

    await db.insert(notifications).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      title: "Savings Withdrawal",
      body: `${member?.full_name} (${member?.member_code}) withdrew UGX ${(amount / 100).toLocaleString()} via ${payment_method}. New balance: UGX ${(newBalance / 100).toLocaleString()}.`,
      type: "in_app",
      status: "sent",
      priority: "high",
      channel: "in_app",
      reference_type: "savings",
      sent_at: new Date(),
    })

    if (member?.phone) {
      await sendSms({
        to: member.phone,
        message: `Dear ${member.full_name}, withdrawal of UGX ${(amount / 100).toLocaleString()} processed. New savings balance: UGX ${(newBalance / 100).toLocaleString()}. - SACCO`,
      })
    }

    return NextResponse.json({ success: true, newBalance })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Withdrawal failed" }, { status: 500 })
  }
}
