import { db } from "@/db"
import { loans } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"

export async function getAllLoans(saccoId: string) {
  return await db
    .select()
    .from(loans)
    .where(eq(loans.sacco_id, saccoId))
    .orderBy(desc(loans.created_at))
}

export async function getLoanById(id: string, saccoId: string) {
  const result = await db
    .select()
    .from(loans)
    .where(and(eq(loans.id, id), eq(loans.sacco_id, saccoId)))
    .limit(1)
  return result[0] || null
}
