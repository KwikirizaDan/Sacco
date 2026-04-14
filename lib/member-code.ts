import { db } from "@/db"
import { members, saccos } from "@/db/schema"
import { eq, count } from "drizzle-orm"

export async function generateMemberCode(saccoId: string): Promise<string> {
  // Get sacco name
  const [sacco] = await db
    .select({ name: saccos.name })
    .from(saccos)
    .where(eq(saccos.id, saccoId))

  if (!sacco) {
    throw new Error("SACCO not found")
  }

  const initials = sacco.name.slice(0, 3).toUpperCase()
  const year = new Date().getFullYear()

  // Count existing members for this sacco
  const [result] = await db
    .select({ count: count() })
    .from(members)
    .where(eq(members.sacco_id, saccoId))

  const sequence = String(result.count + 1).padStart(5, "0")
  return `MBR-${year}-${initials}-${sequence}`
}
