import { NextResponse } from "next/server"
import { db } from "@/db"
import { members } from "@/db/schema"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"
import { OtpStore } from "@/lib/otp-store"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    // Normalize: strip leading + or 0, ensure 256XXXXXXXXX format
    const normalized = phone
      .replace(/\s+/g, "")
      .replace(/^\+/, "")
      .replace(/^0/, "256")

    if (!/^256[0-9]{9}$/.test(normalized)) {
      return NextResponse.json({ error: "Invalid Uganda phone number" }, { status: 400 })
    }

    // Search for member with this phone
    const allMembers = await db
      .select({
        id: members.id,
        full_name: members.full_name,
        member_code: members.member_code,
        phone: members.phone,
        status: members.status,
      })
      .from(members)
      .where(eq(members.sacco_id, SACCO_ID))

    // Fuzzy match: compare normalized numbers
    const normalizeNum = (n: string | null) =>
      (n ?? "")
        .replace(/\s+/g, "")
        .replace(/^\+/, "")
        .replace(/^0/, "256")

    const member = allMembers.find(
      (m) => normalizeNum(m.phone) === normalized
    )

    if (!member) {
      return NextResponse.json(
        { error: "No member found with this phone number. Contact your SACCO admin." },
        { status: 404 }
      )
    }

    if (member.status === "exited") {
      return NextResponse.json(
        { error: "Your membership has been exited. Contact your SACCO admin." },
        { status: 403 }
      )
    }

    if (member.status === "suspended") {
      return NextResponse.json(
        { error: "Your account is suspended. Contact your SACCO admin." },
        { status: 403 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    OtpStore.set(normalized, otp)

    // Send via EgoSMS
    const smsResult = await sendSms({
      to: normalized,
      message: `Your SACCO login code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone. - SACCO`,
    })

    if (!smsResult.success) {
      console.error("[OTP] SMS send failed:", smsResult.error)
      // Still succeed in dev if mock
      if (!process.env.COMMS_SDK_USERNAME) {
        console.log(`[DEV] OTP for ${normalized}: ${otp}`)
      }
    }

    return NextResponse.json({
      success: true,
      memberName: member.full_name.split(" ")[0],
      masked: `+256 *** *** ${normalized.slice(-3)}`,
      // Only expose OTP in dev
      ...(process.env.NODE_ENV === "development" ? { devOtp: otp } : {}),
    })
  } catch (err) {
    console.error("[OTP] Error:", err)
    return NextResponse.json({ error: "Server error. Try again." }, { status: 500 })
  }
}
