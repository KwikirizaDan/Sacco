import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-session"
import { db } from "@/db"
import { loans, members } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const session = await getMobileSession()
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { loan_id, amount, payment_method } = await req.json()

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
    if (loan.status !== "disbursed" && loan.status !== "active")
      return NextResponse.json({ error: "Loan not active" }, { status: 400 })

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, session.memberId))

    const txRef = `LOAN-REPAY-${loan_id}-${Date.now()}`

    return NextResponse.json({
      success: true,
      txRef,
      amount,
      phone: member?.phone,
      email: member?.email,
      fullname: member?.full_name,
      loanRef: loan.loan_ref,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Repayment failed" }, { status: 500 })
  }
}
