import { NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { db } from "@/db"
import { saccoUsers, saccos } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import type { SessionData } from "@/lib/auth"

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "sacco_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
  },
}

export async function POST(req: Request) {
  try {
    if (!process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET environment variable is not set")
    }

    const { email, password } = await req.json()
    if (!email || !password)
      return NextResponse.json(
        { error: "Email and password required." },
        { status: 400 }
      )

    const [user] = await db
      .select()
      .from(saccoUsers)
      .where(eq(saccoUsers.email, email.trim().toLowerCase()))
      .limit(1)
    if (!user)
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    if (!user.is_active)
      return NextResponse.json(
        { error: "Account deactivated. Contact your admin." },
        { status: 403 }
      )

    if (!user.sacco_id)
      return NextResponse.json(
        { error: "Invalid user configuration" },
        { status: 500 }
      )

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )

    await db
      .update(saccoUsers)
      .set({ last_login_at: new Date(), updated_at: new Date() })
      .where(eq(saccoUsers.id, user.id))

    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(
      cookieStore,
      SESSION_OPTIONS
    )
    session.userId = user.id
    session.saccoId = user.sacco_id!
    session.role = user.role as SessionData["role"]
    session.fullName = user.full_name
    session.email = user.email
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({
      success: true,
      role: user.role,
      fullName: user.full_name,
    })
  } catch (err) {
    console.error("[LOGIN]", err)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    )
  }
}
