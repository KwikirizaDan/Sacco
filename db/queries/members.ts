import { db } from "@/db"
import { members } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"

export async function getAllMembers() {
  return await db
    .select()
    .from(members)
    .where(eq(members.sacco_id, SACCO_ID))
    .orderBy(members.created_at)
}

export async function getMembersForSelect() {
  return await db
    .select({
      id: members.id,
      full_name: members.full_name,
      member_code: members.member_code,
      phone: members.phone,
    })
    .from(members)
    .where(eq(members.sacco_id, SACCO_ID))
    .orderBy(members.full_name)
}