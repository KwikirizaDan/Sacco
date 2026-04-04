import { db } from "@/db"
import { savingsAccounts, loans, fines, transactions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function deleteMemberData() {
  await db.delete(transactions).returning()
  await db.delete(fines).returning()
  await db.delete(loans).returning()
  await db.delete(savingsAccounts).returning()
  return { success: true }
}
