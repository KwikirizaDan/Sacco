import { NextResponse } from "next/server"
import { db } from "@/db"
import { members } from "@/db/schema"
import { SACCO_ID } from "@/lib/constants"
import { OtpStore } from "@/lib/otp-store"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET || "sacco-mobile-secret-change-in-production"
)

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone and code required" },
        { status: 400 }
      )
    }

    let normalized = phone
      .replace(/\s+/g, "")
      .replace(/^\+/, "")
      .replace(/^0/, "256")

    // If it's 9 digits without 256, prepend 256
    if (/^[0-9]{9}$/.test(normalized) && !normalized.startsWith("256")) {
      normalized = "256" + normalized
    }

    const result = OtpStore.verify(normalized, code)

    if (result === "not_found") {
      return NextResponse.json(
        { error: "No OTP requested. Please request a new code." },
        { status: 400 }
      )
    }
    if (result === "expired") {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      )
    }
    if (result === "too_many") {
      return NextResponse.json(
        { error: "Too many attempts. Request a new code." },
        { status: 429 }
      )
    }
    if (result === "invalid") {
      return NextResponse.json(
        { error: "Incorrect code. Please try again." },
        { status: 400 }
      )
    }

    // Find member
    const allMembers = await db
      .select()
      .from(members)
      .where(eq(members.sacco_id, SACCO_ID))

    const normalizeNum = (n: string | null) => {
      let norm = (n ?? "")
        .replace(/\s+/g, "")
        .replace(/^\+/, "")
        .replace(/^0/, "256")
      // If it's 9 digits without 256, prepend 256
      if (/^[0-9]{9}$/.test(norm) && !norm.startsWith("256")) {
        norm = "256" + norm
      }
      return norm
    }

    const member = allMembers.find((m) => normalizeNum(m.phone) === normalized)
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Issue JWT session token
    const token = await new SignJWT({
      memberId: member.id,
      memberCode: member.member_code,
      phone: normalized,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    // Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set("sacco_mobile_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        full_name: member.full_name,
        member_code: member.member_code,
        status: member.status,
      },
    })
  } catch (err) {
    console.error("[VERIFY OTP] Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
