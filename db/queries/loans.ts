import { db } from "@/db"
import { loans } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"

export async function getAllLoans() {
    return await db
        .select()
        .from(loans)
        .where(eq(loans.sacco_id, SACCO_ID))
        .orderBy(desc(loans.created_at))
}

export async function getLoanById(id: string) {
    const result = await db
        .select()
        .from(loans)
        .where(eq(loans.id, id))
        .limit(1)
    return result[0] || null
}