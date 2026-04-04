import { getAllNotifications } from "@/db/queries/notifications"
import { db } from "@/db"
import { members } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { NotificationsClient } from "./components/notifications-client"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const [allNotifications, allMembers] = await Promise.all([
    getAllNotifications(),
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

  return (
    <NotificationsClient
      notifications={allNotifications}
      members={allMembers}
    />
  )
}
