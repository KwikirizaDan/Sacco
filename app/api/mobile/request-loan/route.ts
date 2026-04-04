import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-session"
import { db } from "@/db"
import { loans, members, notifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"

export async function POST(req: Request) {
  try {
    const session = await getMobileSession()
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { amount, duration_months, purpose, reason } = await req.json()

    if (!amount || amount < 100000) {
      return NextResponse.json(
        { error: "Minimum loan amount is UGX 1,000" },
        { status: 400 }
      )
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, session.memberId))
    if (!member)
      return NextResponse.json({ error: "Member not found" }, { status: 404 })

    const loan_ref = `LN-MOB-${Date.now()}`

    // Simple interest calc (10% monthly)
    const interestRate = 10
    const totalInterest = (amount * interestRate * duration_months) / 100
    const totalRepayable = amount + totalInterest
    const monthlyPayment = Math.ceil(totalRepayable / duration_months)
    const dailyPayment = Math.ceil(totalRepayable / (duration_months * 30))

    const dueDate = new Date()
    dueDate.setMonth(dueDate.getMonth() + duration_months)

    await db.insert(loans).values({
      sacco_id: SACCO_ID,
      member_id: member.id,
      loan_ref,
      amount,
      expected_received: totalRepayable,
      balance: totalRepayable,
      interest_rate: String(interestRate),
      interest_type: "monthly",
      duration_months,
      status: "pending",
      daily_payment: dailyPayment,
      monthly_payment: monthlyPayment,
      due_date: dueDate.toISOString().split("T")[0],
      notes: `Purpose: ${purpose}${reason ? ` | Reason: ${reason}` : ""}`,
    })

    // Create in-app notification for admin
    await db.insert(notifications).values({
      sacco_id: SACCO_ID,
      member_id: member.id,
      title: "New Loan Request",
      body: `${member.full_name} (${member.member_code}) has requested a loan of UGX ${(amount / 100).toLocaleString()} for ${duration_months} months. Purpose: ${purpose}. Ref: ${loan_ref}`,
      type: "in_app",
      status: "sent",
      priority: "high",
      channel: "in_app",
      reference_type: "loan",
      sent_at: new Date(),
    })

    // Send SMS to member
    if (member.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your loan request of UGX ${(amount / 100).toLocaleString()} for ${duration_months} months has been submitted. Ref: ${loan_ref}. You will be notified once approved. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Request Loan] SMS notification failed:", smsError)
      }
    }

    return NextResponse.json({ success: true, loan_ref })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Failed to submit loan request" },
      { status: 500 }
    )
  }
}
