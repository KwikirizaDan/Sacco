import { db } from "@/db"
import { members } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getAllMembers(saccoId: string) {
  return await db
    .select()
    .from(members)
    .where(eq(members.sacco_id, saccoId))
    .orderBy(members.created_at)
}

export async function getMembersForSelect(saccoId: string) {
  return await db
    .select({
      id: members.id,
      full_name: members.full_name,
      member_code: members.member_code,
      phone: members.phone,
    })
    .from(members)
    .where(eq(members.sacco_id, saccoId))
    .orderBy(members.full_name)
}
