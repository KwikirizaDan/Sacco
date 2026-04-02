import { db } from "@/db"
import { fines, fineCategories, members } from "@/db/schema"
import { eq, desc, sum, count } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"

export async function getAllFines() {
  return await db
    .select({
      id: fines.id,
      fine_ref: fines.fine_ref,
      amount: fines.amount,
      reason: fines.reason,
      description: fines.description,
      status: fines.status,
      priority: fines.priority,
      due_date: fines.due_date,
      paid_at: fines.paid_at,
      payment_method: fines.payment_method,
      payment_reference: fines.payment_reference,
      waiver_reason: fines.waiver_reason,
      notes: fines.notes,
      created_at: fines.created_at,
      updated_at: fines.updated_at,
      member_id: fines.member_id,
      category_id: fines.category_id,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
      category_name: fineCategories.name,
    })
    .from(fines)
    .leftJoin(members, eq(fines.member_id, members.id))
    .leftJoin(fineCategories, eq(fines.category_id, fineCategories.id))
    .where(eq(fines.sacco_id, SACCO_ID))
    .orderBy(desc(fines.created_at))
}

export async function getFinesStats() {
  const [total] = await db
    .select({ total: sum(fines.amount), count: count() })
    .from(fines)
    .where(eq(fines.sacco_id, SACCO_ID))

  const [pending] = await db
    .select({ total: sum(fines.amount), count: count() })
    .from(fines)
    .where(eq(fines.status, "pending"))

  const [paid] = await db
    .select({ total: sum(fines.amount), count: count() })
    .from(fines)
    .where(eq(fines.status, "paid"))

  const [waived] = await db
    .select({ count: count() })
    .from(fines)
    .where(eq(fines.status, "waived"))

  return {
    totalAmount: Number(total?.total ?? 0),
    totalCount: total?.count ?? 0,
    pendingAmount: Number(pending?.total ?? 0),
    pendingCount: pending?.count ?? 0,
    paidAmount: Number(paid?.total ?? 0),
    paidCount: paid?.count ?? 0,
    waivedCount: waived?.count ?? 0,
  }
}