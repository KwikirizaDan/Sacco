import { db } from "@/db"
import { transactions } from "@/db/schema"
import { count } from "drizzle-orm"

async function checkTransactions() {
  try {
    const result = await db
      .select({
        count: count(),
        sacco_id: transactions.sacco_id,
      })
      .from(transactions)
      .groupBy(transactions.sacco_id)
    console.log("Transaction counts by sacco_id:", result)
  } catch (err) {
    console.error("Error:", err)
  }
}

checkTransactions()
