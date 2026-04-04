"use server"

import { db } from "@/db"
import {
  transactions,
  fines,
  loans,
  savingsAccounts,
  members,
} from "@/db/schema"

export async function clearAllMemberDataAction() {
  try {
    await db.delete(transactions).returning()
    await db.delete(fines).returning()
    await db.delete(loans).returning()
    await db.delete(savingsAccounts).returning()

    return { success: true, message: "All member data cleared" }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to clear data" }
  }
}
