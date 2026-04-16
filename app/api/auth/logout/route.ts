import { NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import type { SessionData } from "@/lib/auth"

export async function POST() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set")
  }

  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, {
    password: process.env.SESSION_SECRET,
    cookieName: "sacco_session",
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
  })
  session.destroy()
  return NextResponse.json({ success: true })
}
