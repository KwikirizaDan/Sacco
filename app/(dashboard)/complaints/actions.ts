"use server"

import { smartDb, isUsingLocalDatabase } from "@/lib/db/database-adapter"
import { complaints, members, notifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { SACCO_ID } from "@/lib/constants"
import { sendSms } from "@/lib/sms"
import { z } from "zod"

export type ComplaintFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const complaintSchema = z.object({
  member_id: z.string().uuid("Please select a member").optional().or(z.literal("")),
  subject: z.string().min(3, "Subject is required"),
  body: z.string().min(10, "Please describe the complaint in detail"),
  category: z.string().default("general"),
  priority: z.string().default("normal"),
  notes: z.string().optional(),
})

// ─── Add Complaint ─────────────────────────────────────────────────────────────

export async function addComplaintAction(
  prevState: ComplaintFormState,
  formData: FormData
): Promise<ComplaintFormState> {
  try {
    const raw = {
      member_id: formData.get("member_id") as string,
      subject: formData.get("subject") as string,
      body: formData.get("body") as string,
      category: formData.get("category") as string || "general",
      priority: formData.get("priority") as string || "normal",
      notes: formData.get("notes") as string,
    }

    const parsed = complaintSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const complaint_ref = `CMP-${Date.now()}`

    // Use smart database adapter (automatically switches between local and remote)
    await smartDb.insert(complaints).values({
      sacco_id: SACCO_ID,
      member_id: parsed.data.member_id || null,
      complaint_ref,
      subject: parsed.data.subject,
      body: parsed.data.body,
      category: parsed.data.category,
      priority: parsed.data.priority,
      notes: parsed.data.notes || null,
      status: "open",
    })

    // Notify member if linked (only when online)
    if (parsed.data.member_id && !isUsingLocalDatabase()) {
      const [member] = await smartDb
        .select(members)
        .where(eq(members.id, parsed.data.member_id))

      if (member?.phone) {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your complaint (Ref: ${complaint_ref}) has been received and is being reviewed. We will respond shortly. - SACCO`,
        })
      }
    }

    revalidatePath("/complaints")
    return { success: true }
  } catch (err) {
    console.error(err)
    // Check if it's a database connection error (offline)
    if (err instanceof Error && (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo'))) {
      return { error: "You are offline. Please check your internet connection and try again." }
    }
    return { error: "Failed to submit complaint." }
  }
}

// ─── Update Complaint Status ───────────────────────────────────────────────────

export async function updateComplaintStatusAction(
  id: string,
  status: "open" | "in_progress" | "resolved",
  resolution_notes?: string
): Promise<ComplaintFormState> {
  try {
    const [complaint] = await smartDb
      .select(complaints)
      .where(eq(complaints.id, id))

    if (!complaint) return { error: "Complaint not found." }

    await smartDb
      .update(complaints)
      .set({
        status,
        resolution_notes: resolution_notes || complaint.resolution_notes,
        resolved_at: status === "resolved" ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(complaints.id, id))

    // Notify member on resolution (only when online)
    if (status === "resolved" && complaint.member_id && !isUsingLocalDatabase()) {
      const [member] = await smartDb
        .select(members)
        .where(eq(members.id, complaint.member_id))

      if (member?.phone) {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your complaint (Ref: ${complaint.complaint_ref}) has been resolved. ${resolution_notes ? `Resolution: ${resolution_notes}` : ""} - SACCO`,
        })
      }
    }

    revalidatePath("/complaints")
    return { success: true }
  } catch (err) {
    console.error(err)
    // Check if it's a database connection error (offline)
    if (err instanceof Error && (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo'))) {
      return { error: "You are offline. Please check your internet connection and try again." }
    }
    return { error: "Failed to update complaint status." }
  }
}

// ─── Resolve Complaint ─────────────────────────────────────────────────────────

export async function resolveComplaintAction(
  prevState: ComplaintFormState,
  formData: FormData
): Promise<ComplaintFormState> {
  const id = formData.get("id") as string
  const resolution_notes = formData.get("resolution_notes") as string

  if (!resolution_notes?.trim()) {
    return { error: "Resolution notes are required." }
  }

  return updateComplaintStatusAction(id, "resolved", resolution_notes)
}

// ─── Delete Complaint ──────────────────────────────────────────────────────────

export async function deleteComplaintAction(
  id: string
): Promise<ComplaintFormState> {
  try {
    await smartDb.delete(complaints).where(eq(complaints.id, id))
    revalidatePath("/complaints")
    return { success: true }
  } catch (err) {
    console.error(err)
    // Check if it's a database connection error (offline)
    if (err instanceof Error && (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo'))) {
      return { error: "You are offline. Please check your internet connection and try again." }
    }
    return { error: "Failed to delete complaint." }
  }
}

// ─── Submit Rating ─────────────────────────────────────────────────────────────

export async function submitRatingAction(
  id: string,
  rating: number,
  feedback: string
): Promise<ComplaintFormState> {
  try {
    await smartDb
      .update(complaints)
      .set({
        satisfaction_rating: rating,
        feedback,
        updated_at: new Date(),
      })
      .where(eq(complaints.id, id))

    revalidatePath("/complaints")
    return { success: true }
  } catch (err) {
    console.error(err)
    // Check if it's a database connection error (offline)
    if (err instanceof Error && (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo'))) {
      return { error: "You are offline. Please check your internet connection and try again." }
    }
    return { error: "Failed to submit rating." }
  }
}
