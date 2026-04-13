import { db } from "@/db"
import { notifications, members } from "@/db/schema"
import { eq, desc, count, isNull } from "drizzle-orm"

export async function getAllNotifications(saccoId: string) {
  return await db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      type: notifications.type,
      status: notifications.status,
      priority: notifications.priority,
      channel: notifications.channel,
      recipient_phone: notifications.recipient_phone,
      reference_type: notifications.reference_type,
      retry_count: notifications.retry_count,
      error_message: notifications.error_message,
      scheduled_at: notifications.scheduled_at,
      sent_at: notifications.sent_at,
      read_at: notifications.read_at,
      created_at: notifications.created_at,
      member_id: notifications.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
    })
    .from(notifications)
    .leftJoin(members, eq(notifications.member_id, members.id))
    .where(eq(notifications.sacco_id, saccoId))
    .orderBy(desc(notifications.created_at))
    .limit(100)
}

export async function getUnreadNotificationsCount(saccoId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(eq(notifications.sacco_id, saccoId))
  return result?.count ?? 0
}

export async function getLatestNotifications(saccoId: string, limit = 5) {
  return await db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      type: notifications.type,
      status: notifications.status,
      channel: notifications.channel,
      sent_at: notifications.sent_at,
      read_at: notifications.read_at,
      created_at: notifications.created_at,
      member_name: members.full_name,
    })
    .from(notifications)
    .leftJoin(members, eq(notifications.member_id, members.id))
    .where(eq(notifications.sacco_id, saccoId))
    .orderBy(desc(notifications.created_at))
    .limit(limit)
}
