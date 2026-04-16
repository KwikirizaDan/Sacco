import { requireAuth } from "@/lib/auth"
import { getAllComplaints } from "@/db/queries/complaints"
import { getMembersForSelect } from "@/db/queries/members"
import { db } from "@/db"
import { complaints, members } from "@/db/schema"
import { eq, count, and } from "drizzle-orm"
import { ComplaintsClient } from "./components/complaints-client"

type MemberSelect = {
  id: string
  full_name: string
  member_code: string
  phone: string | null
}

export default async function ComplaintsPage() {
  const user = await requireAuth()
  const [allComplaints, allMembers] = await Promise.all([
    getAllComplaints(user.saccoId),
    getMembersForSelect(user.saccoId),
  ])

  const [openCount] = await db
    .select({ count: count() })
    .from(complaints)
    .where(
      and(eq(complaints.status, "open"), eq(complaints.sacco_id, user.saccoId))
    )

  const [inProgressCount] = await db
    .select({ count: count() })
    .from(complaints)
    .where(
      and(
        eq(complaints.status, "in_progress"),
        eq(complaints.sacco_id, user.saccoId)
      )
    )

  const [resolvedCount] = await db
    .select({ count: count() })
    .from(complaints)
    .where(
      and(
        eq(complaints.status, "resolved"),
        eq(complaints.sacco_id, user.saccoId)
      )
    )

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
