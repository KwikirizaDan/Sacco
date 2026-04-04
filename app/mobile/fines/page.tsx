import { requireMobileAuth } from "@/lib/mobile-session"
import { db } from "@/db"
import { fines, fineCategories } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { MobileStatusBar, MobilePageHeader } from "../components/mobile-ui"
import { MobileFinesClient } from "./mobile-fines-client"

export default async function MobileFinesPage() {
  const member = await requireMobileAuth()

  const memberFines = await db
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
      waiver_reason: fines.waiver_reason,
      created_at: fines.created_at,
      category_name: fineCategories.name,
    })
    .from(fines)
    .leftJoin(fineCategories, eq(fines.category_id, fineCategories.id))
    .where(eq(fines.member_id, member.id))
    .orderBy(desc(fines.created_at))

  return (
    <div style={{ background: "#0f1623", minHeight: "100dvh" }}>
      <MobileStatusBar />
      <MobilePageHeader title="Fines" subtitle="View and pay outstanding fines" />
      <MobileFinesClient fines={memberFines} />
    </div>
  )
}
