import { db } from "@/db"
import {
  saccos,
  interestRates,
  loanCategories,
  savingsCategories,
  fineCategories,
} from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getSaccoSettings(saccoId: string) {
  const [sacco] = await db.select().from(saccos).where(eq(saccos.id, saccoId))
  return sacco
}

export async function getInterestRates(saccoId: string) {
  return await db
    .select()
    .from(interestRates)
    .where(eq(interestRates.sacco_id, saccoId))
    .orderBy(interestRates.min_amount)
}

export async function getLoanCategories(saccoId: string) {
  return await db
    .select()
    .from(loanCategories)
    .where(eq(loanCategories.sacco_id, saccoId))
}

export async function getSavingsCategories(saccoId: string) {
  return await db
    .select()
    .from(savingsCategories)
    .where(eq(savingsCategories.sacco_id, saccoId))
}

export async function getFineCategories(saccoId: string) {
  return await db
    .select()
    .from(fineCategories)
    .where(eq(fineCategories.sacco_id, saccoId))
}

export async function getPaymentSettings(saccoId: string) {
  const sacco = await getSaccoSettings(saccoId)
  const settings = (() => {
    try {
      return JSON.parse(sacco?.settings ?? "{}")
    } catch {
      return {}
    }
  })()
  const payments = settings?.payments ?? {}

  // Auto-enable Flutterwave if secret key is configured
  if (process.env.FLW_SECRET_KEY && !payments.flutterwave_enabled) {
    payments.flutterwave_enabled = true
  }

  return payments
}
