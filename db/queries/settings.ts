import { db } from "@/db"
import { saccos, interestRates, loanCategories, savingsCategories, fineCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"

export async function getSaccoSettings() {
  const [sacco] = await db
    .select()
    .from(saccos)
    .where(eq(saccos.id, SACCO_ID))
  return sacco
}

export async function getInterestRates() {
  return await db
    .select()
    .from(interestRates)
    .where(eq(interestRates.sacco_id, SACCO_ID))
    .orderBy(interestRates.min_amount)
}

export async function getLoanCategories() {
  return await db
    .select()
    .from(loanCategories)
    .where(eq(loanCategories.sacco_id, SACCO_ID))
}

export async function getSavingsCategories() {
  return await db
    .select()
    .from(savingsCategories)
    .where(eq(savingsCategories.sacco_id, SACCO_ID))
}

export async function getFineCategories() {
  return await db
    .select()
    .from(fineCategories)
    .where(eq(fineCategories.sacco_id, SACCO_ID))
}