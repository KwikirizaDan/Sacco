"use server"

import { smartDb } from "@/lib/db/database-adapter"
import { notifications, members } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"

export type NotificationFormState = {
  success?: boolean
  error?: string
  sent?: number
}

export async function sendNotificationAction(
  prevState: NotificationFormState,
  formData: FormData
): Promise<NotificationFormState> {
  try {
    const target = formData.get("target") as string
    const member_id = formData.get("member_id") as string
    const title = formData.get("title") as string
    const body = formData.get("body") as string
    const channel = formData.get("channel") as string
    const priority = formData.get("priority") as string

    if (!title || !body) return { error: "Title and message are required." }

    let targetMembers: any[] = []

    if (target === "all") {
      targetMembers = await smartDb
        .select(members)
        .where(eq(members.sacco_id, SACCO_ID))
    } else if (target === "active") {
      targetMembers = await smartDb
        .select(members)
        .where(eq(members.status, "active"))
    } else if (target === "member" && member_id) {
      const [m] = await smartDb
        .select(members)
        .where(eq(members.id, member_id))
      if (m) targetMembers = [m]
    }

    let sent = 0

    for (const member of targetMembers) {
      await smartDb.insert(notifications).values({
        sacco_id: SACCO_ID,
        member_id: member.id,
        title,
        body,
        type: channel === "sms" ? "sms" : "in_app",
        status: "pending",
        priority: priority || "normal",
        channel,
        recipient_phone: member.phone,
      })

      if (channel === "sms" && member.phone) {
        try {
          const smsResult = await sendSms({ to: member.phone, message: `${title}: ${body}` })
          
          if (smsResult.success) {
            await smartDb
              .update(notifications)
              .set({ status: "sent", sent_at: new Date() })
              .where(eq(notifications.member_id, member.id))
            sent++
          } else {
            await smartDb
              .update(notifications)
              .set({ status: "failed", error_message: smsResult.error || "SMS delivery failed" })
              .where(eq(notifications.member_id, member.id))
          }
        } catch (error) {
          await smartDb
            .update(notifications)
            .set({ status: "failed", error_message: error instanceof Error ? error.message : "SMS delivery failed" })
            .where(eq(notifications.member_id, member.id))
        }
      } else {
        await smartDb
          .update(notifications)
          .set({ status: "sent", sent_at: new Date() })
          .where(eq(notifications.member_id, member.id))
        sent++
      }
    }

    revalidatePath("/notifications")
    return { success: true, sent }
  } catch (err) {
    console.error(err)
    return { error: "Failed to send notification." }
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    await smartDb
      .update(notifications)
      .set({ read_at: new Date() })
      .where(eq(notifications.id, id))
    revalidatePath("/notifications")
    return { success: true }
  } catch (err) {
    return { error: "Failed to mark as read." }
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    await smartDb.delete(notifications).where(eq(notifications.id, id))
    revalidatePath("/notifications")
    return { success: true }
  } catch {
    return { error: "Failed to delete." }
  }
}
