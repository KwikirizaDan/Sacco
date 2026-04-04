import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-session"
import { db } from "@/db"
import { loans, transactions, members, notifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"

export async function POST(req: Request) {
  try {
    const session = await getMobileSession()
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { loan_id, amount, tx_ref } = await req.json()
    if (!loan_id || !amount || amount < 1000) {
      return NextResponse.json(
        { error: "Valid amount required (min UGX 1,000)" },
        { status: 400 }
      )
    }

    const [loan] = await db.select().from(loans).where(eq(loans.id, loan_id))
    if (!loan)
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    if (loan.member_id !== session.memberId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const existing = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference_id, tx_ref))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ success: true, message: "Already processed" })
    }

    const newBalance = Math.max(0, loan.balance - amount)
    const newStatus = newBalance === 0 ? "settled" : "active"

    await db
      .update(loans)
      .set({
        balance: newBalance,
        status: newStatus,
        settled_at: newBalance === 0 ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(loans.id, loan_id))

    await db.insert(transactions).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      type: "loan_repayment",
      amount,
      balance_after: newBalance,
      reference_id: tx_ref,
      narration: `Loan repayment - ${loan.loan_ref}`,
      payment_method: "flutterwave",
    })

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, session.memberId))

    await db.insert(notifications).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      title: "Loan Repayment",
      body: `${member?.full_name} (${member?.member_code}) repaid UGX ${(amount / 100).toLocaleString()} to loan ${loan.loan_ref}. New balance: UGX ${(newBalance / 100).toLocaleString()}.`,
      type: "in_app",
      status: "sent",
      priority: "normal",
      channel: "in_app",
      reference_type: "loan",
      sent_at: new Date(),
    })

    if (member?.phone) {
      await sendSms({
        to: member.phone,
        message: `Dear ${member.full_name}, repayment of UGX ${(amount / 100).toLocaleString()} received. Loan balance: UGX ${(newBalance / 100).toLocaleString()}. - SACCO`,
      })
    }

    return NextResponse.json({
      success: true,
      newBalance,
      status: newStatus,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Repayment failed" }, { status: 500 })
  }
}
