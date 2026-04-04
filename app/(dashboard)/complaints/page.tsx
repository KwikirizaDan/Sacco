import { getAllComplaints } from "@/db/queries/complaints"
import { db } from "@/db"
import { members } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { ComplaintsClient } from "./components/complaints-client"
import { complaints } from "@/db/schema"

export default async function ComplaintsPage() {
  const [allComplaints, allMembers] = await Promise.all([
    getAllComplaints(),
    db
      .select({
        id: members.id,
        full_name: members.full_name,
        member_code: members.member_code,
        phone: members.phone,
      })
      .from(members)
      .where(eq(members.sacco_id, SACCO_ID))
      .orderBy(members.full_name),
  ])

  const [openCount] = await db
    .select({ count: count() })
    .from(complaints)
    .where(eq(complaints.status, "open"))

  const [inProgressCount] = await db
    .select({ count: count() })
    .from(complaints)
    .where(eq(complaints.status, "in_progress"))

  const [resolvedCount] = await db
    .select({ count: count() })
    .from(complaints)
    .where(eq(complaints.status, "resolved"))

  return (
    <ComplaintsClient
      complaints={allComplaints}
      members={allMembers}
      stats={{
        total: allComplaints.length,
        open: openCount?.count ?? 0,
        inProgress: inProgressCount?.count ?? 0,
        resolved: resolvedCount?.count ?? 0,
      }}
    />
  )
}
