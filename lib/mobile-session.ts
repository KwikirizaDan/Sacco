import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { db } from "@/db"
import { members } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

const JWT_SECRET = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET || "sacco-mobile-secret-change-in-production"
)

export interface MobileSession {
  memberId: string
  memberCode: string
  phone: string
}

export async function getMobileSession(): Promise<MobileSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("sacco_mobile_token")?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as MobileSession
  } catch {
    return null
  }
}

export async function requireMobileAuth() {
  const session = await getMobileSession()
  if (!session) redirect("/mobile/login")

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, session.memberId))

  if (!member) redirect("/mobile/login")
  return member
}
