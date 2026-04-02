import { db } from "@/db"
import { members } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { SACCO_ID, SACCO_NAME } from "./constants"

export async function generateMemberCode(): Promise<string> {
  const initials = SACCO_NAME.slice(0, 3).toUpperCase()
  const year = new Date().getFullYear()
  const [result] = await db
    .select({ count: count() })
    .from(members)
    .where(eq(members.sacco_id, SACCO_ID))
  const sequence = String(result.count + 1).padStart(5, "0")
  return `MBR-${year}-${initials}-${sequence}`
}