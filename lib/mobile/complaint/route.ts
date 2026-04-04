import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-session"
import { db } from "@/db"
import { complaints, members, notifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"

export async function POST(req: Request) {
  try {
    const session = await getMobileSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { subject, body, category, priority } = await req.json()
    if (!subject || !body) return NextResponse.json({ error: "Subject and body required" }, { status: 400 })

    const complaint_ref = `CMP-MOB-${Date.now()}`

    await db.insert(complaints).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      complaint_ref,
      subject,
      body,
      category: category || "general",
      priority: priority || "normal",
      status: "open",
    })

    const [member] = await db.select().from(members).where(eq(members.id, session.memberId))

    // Admin notification
    await db.insert(notifications).values({
      sacco_id: SACCO_ID,
      member_id: session.memberId,
      title: `New Complaint: ${subject}`,
      body: `${member?.full_name} (${member?.member_code}) submitted a ${priority} priority complaint. Ref: ${complaint_ref}. Category: ${category}`,
      type: "in_app",
      status: "sent",
      priority: priority === "urgent" ? "urgent" : "high",
      channel: "in_app",
      reference_type: "complaint",
      sent_at: new Date(),
    })

    if (member?.phone) {
      await sendSms({
        to: member.phone,
        message: `Dear ${member.full_name}, your complaint (Ref: ${complaint_ref}) has been received. We will respond shortly. - SACCO`,
      })
    }

    return NextResponse.json({ success: true, complaint_ref })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Submission failed" }, { status: 500 })
  }
}
