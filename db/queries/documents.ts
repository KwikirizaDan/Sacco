import { db } from "@/db"
import { documents, members } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function getAllDocuments(saccoId: string) {
  return await db
    .select({
      id: documents.id,
      sacco_id: documents.sacco_id,
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
    .where(eq(documents.sacco_id, saccoId))
    .orderBy(desc(documents.created_at))
}

export async function getMembersForDocuments(saccoId: string) {
  return await db
    .select({
      id: members.id,
      full_name: members.full_name,
      member_code: members.member_code,
    })
    .from(members)
    .where(eq(members.sacco_id, saccoId))
    .orderBy(members.full_name)
}
