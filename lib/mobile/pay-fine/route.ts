import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-session"
import { db } from "@/db"
import { fines, members, transactions, notifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"

export async function POST(req: Request) {
  try {
    const session = await getMobileSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { fine_id, payment_method } = await req.json()
    if (!fine_id) return NextResponse.json({ error: "Fine ID required" }, { status: 400 })

    const [fine] = await db.select().from(fines).where(eq(fines.id, fine_id))
    if (!fine) return NextResponse.json({ error: "Fine not found" }, { status: 404 })
    if (fine.member_id !== session.memberId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    if (fine.status !== "pending") return NextResponse.json({ error: "Fine already settled" }, { status: 400 })

    const [member] = await db.select().from(members).where(eq(members.id, session.memberId))

    await db.update(fines).set({
      status: "paid",
      paid_at: new Date(),
      payment_method: (payment_method as any) || "cash",
      updated_at: new Date(),
    }).where(eq(fines.id, fine_id))

    await db.insert(transactions).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      type: "fine_payment",
      amount: fine.amount,
      narration: `Fine payment - ${fine.fine_ref} - ${fine.reason}`,
      payment_method: (payment_method as any) || "cash",
    })

    // Notify admin
    await db.insert(notifications).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      title: "Fine Payment Received",
      body: `${member?.full_name} (${member?.member_code}) paid fine ${fine.fine_ref} of UGX ${(fine.amount / 100).toLocaleString()} via ${payment_method}.`,
      type: "in_app",
      status: "sent",
      priority: "normal",
      channel: "in_app",
      reference_type: "fine",
      sent_at: new Date(),
    })

    if (member?.phone) {
      await sendSms({
        to: member.phone,
        message: `Dear ${member.full_name}, your fine of UGX ${(fine.amount / 100).toLocaleString()} (Ref: ${fine.fine_ref}) has been marked as paid via ${payment_method}. Thank you. - SACCO`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Payment failed" }, { status: 500 })
  }
}
