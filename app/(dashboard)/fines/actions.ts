"use server"

import { smartDb } from "@/lib/db/database-adapter"
import { fines, members, fineCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { SACCO_ID } from "@/lib/constants"
import { sendSms, smsTemplates } from "@/lib/sms"
import { z } from "zod"

export type FineFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const fineSchema = z.object({
  member_id: z.string().uuid("Please select a member"),
  category_id: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  reason: z.string().min(2, "Reason is required"),
  description: z.string().optional(),
  priority: z.string().default("normal"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

// ─── Add Fine ─────────────────────────────────────────────────────────────────

export async function addFineAction(
  prevState: FineFormState,
  formData: FormData
): Promise<FineFormState> {
  try {
    const raw = {
      member_id: formData.get("member_id") as string,
      category_id: formData.get("category_id") as string,
      amount: formData.get("amount") as string,
      reason: formData.get("reason") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as string || "normal",
      due_date: formData.get("due_date") as string,
      notes: formData.get("notes") as string,
    }

    const parsed = fineSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const amountInCents = Math.floor(parsed.data.amount * 100)
    const fine_ref = `FN-${Date.now()}`

    await smartDb.insert(fines).values({
      sacco_id: SACCO_ID,
      member_id: parsed.data.member_id,
      category_id: parsed.data.category_id || null,
      fine_ref,
      amount: amountInCents,
      reason: parsed.data.reason,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      due_date: parsed.data.due_date || null,
      notes: parsed.data.notes || null,
      status: "pending",
    })

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, parsed.data.member_id))

    if (member?.phone) {
      await sendSms({
        to: member.phone,
        message: smsTemplates.fineIssued(
          member.full_name,
          `UGX ${(amountInCents / 100).toLocaleString()}`,
          parsed.data.reason
        ),
      })
    }

    revalidatePath("/fines")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add fine." }
  }
}

// ─── Mark Fine Paid ───────────────────────────────────────────────────────────

export async function markFinePaidAction(
  prevState: FineFormState,
  formData: FormData
): Promise<FineFormState> {
  try {
    const id = formData.get("fine_id") as string
    const payment_method = formData.get("payment_method") as string
    const payment_reference = formData.get("payment_reference") as string

    const [fine] = await smartDb
      .select(fines)
      .where(eq(fines.id, id))

    if (!fine) return { error: "Fine not found." }

    await smartDb
      .update(fines)
      .set({
        status: "paid",
        paid_at: new Date(),
        payment_method: (payment_method as any) || "cash",
        payment_reference: payment_reference || null,
        updated_at: new Date(),
      })
      .where(eq(fines.id, id))

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, fine.member_id))

    if (member?.phone) {
      await sendSms({
        to: member.phone,
        message: `Dear ${member.full_name}, your fine of UGX ${(fine.amount / 100).toLocaleString()} (Ref: ${fine.fine_ref}) has been marked as paid. Thank you. - SACCO`,
      })
    }

    revalidatePath("/fines")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to mark fine as paid." }
  }
}

// ─── Waive Fine ───────────────────────────────────────────────────────────────

export async function waiveFineAction(
  id: string,
  waiver_reason: string
): Promise<FineFormState> {
  try {
    const [fine] = await smartDb
      .select(fines)
      .where(eq(fines.id, id))

    if (!fine) return { error: "Fine not found." }

    await smartDb
      .update(fines)
      .set({
        status: "waived",
        waiver_reason,
        updated_at: new Date(),
      })
      .where(eq(fines.id, id))

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, fine.member_id))

    if (member?.phone) {
      await sendSms({
        to: member.phone,
        message: `Dear ${member.full_name}, your fine of UGX ${(fine.amount / 100).toLocaleString()} (Ref: ${fine.fine_ref}) has been waived. Reason: ${waiver_reason}. - SACCO`,
      })
    }

    revalidatePath("/fines")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to waive fine." }
  }
}

// ─── Delete Fine ──────────────────────────────────────────────────────────────

export async function deleteFineAction(id: string): Promise<FineFormState> {
  try {
    await smartDb.delete(fines).where(eq(fines.id, id))
    revalidatePath("/fines")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete fine." }
  }
}
