import { db } from "@/db"
import { documents, members } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"

export async function getAllDocuments() {
  return await db
    .select({
      id: documents.id,
      type: documents.type,
      file_name: documents.file_name,
      blob_url: documents.blob_url,
      created_at: documents.created_at,
      loan_id: documents.loan_id,
      member_id: documents.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
    })
    .from(documents)
    .leftJoin(members, eq(documents.member_id, members.id))
    .where(eq(documents.sacco_id, SACCO_ID))
    .orderBy(desc(documents.created_at))
}

export async function getMembersForDocuments() {
  return await db
    .select({
      id: members.id,
      full_name: members.full_name,
      member_code: members.member_code,
    })
    .from(members)
    .where(eq(members.sacco_id, SACCO_ID))
    .orderBy(members.full_name)
}