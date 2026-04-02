import { db } from "@/db"
import { complaints, members } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"

export async function getAllComplaints() {
  return await db
    .select({
      id: complaints.id,
      complaint_ref: complaints.complaint_ref,
      subject: complaints.subject,
      body: complaints.body,
      category: complaints.category,
      priority: complaints.priority,
      status: complaints.status,
      resolution_notes: complaints.resolution_notes,
      resolved_at: complaints.resolved_at,
      satisfaction_rating: complaints.satisfaction_rating,
      feedback: complaints.feedback,
      notes: complaints.notes,
      created_at: complaints.created_at,
      updated_at: complaints.updated_at,
      member_id: complaints.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
    })
    .from(complaints)
    .leftJoin(members, eq(complaints.member_id, members.id))
    .where(eq(complaints.sacco_id, SACCO_ID))
    .orderBy(desc(complaints.created_at))
}