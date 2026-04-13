import { db } from "@/db"
import {
  savingsAccounts,
  savingsCategories,
  members,
  transactions,
} from "@/db/schema"
import { eq, desc, sum, count, and } from "drizzle-orm"

export async function getAllSavingsAccounts(saccoId: string) {
  return await db
    .select({
      id: savingsAccounts.id,
      account_number: savingsAccounts.account_number,
      balance: savingsAccounts.balance,
      account_type: savingsAccounts.account_type,
      is_locked: savingsAccounts.is_locked,
      lock_until: savingsAccounts.lock_until,
      lock_reason: savingsAccounts.lock_reason,
      created_at: savingsAccounts.created_at,
      updated_at: savingsAccounts.updated_at,
      member_id: savingsAccounts.member_id,
      category_id: savingsAccounts.category_id,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
      category_name: savingsCategories.name,
    })
    .from(savingsAccounts)
    .leftJoin(members, eq(savingsAccounts.member_id, members.id))
    .leftJoin(
      savingsCategories,
      eq(savingsAccounts.category_id, savingsCategories.id)
    )
    .where(eq(savingsAccounts.sacco_id, saccoId))
    .orderBy(desc(savingsAccounts.balance))
}

export async function getSavingsStats(saccoId: string) {
  const [total] = await db
    .select({ total: sum(savingsAccounts.balance), count: count() })
    .from(savingsAccounts)
    .where(eq(savingsAccounts.sacco_id, saccoId))

  const [locked] = await db
    .select({ count: count() })
    .from(savingsAccounts)
    .where(
      and(
        eq(savingsAccounts.sacco_id, saccoId),
        eq(savingsAccounts.is_locked, true)
      )
    )

  const [regular] = await db
    .select({ count: count() })
    .from(savingsAccounts)
    .where(
      and(
        eq(savingsAccounts.sacco_id, saccoId),
        eq(savingsAccounts.account_type, "regular")
      )
    )

  const [fixed] = await db
    .select({ count: count() })
    .from(savingsAccounts)
    .where(
      and(
        eq(savingsAccounts.sacco_id, saccoId),
        eq(savingsAccounts.account_type, "fixed")
      )
    )

  return {
    totalBalance: Number(total?.total ?? 0),
    totalAccounts: total?.count ?? 0,
    lockedAccounts: locked?.count ?? 0,
    regularAccounts: regular?.count ?? 0,
    fixedAccounts: fixed?.count ?? 0,
    avgBalance: total?.count
      ? Math.floor(Number(total?.total ?? 0) / Number(total?.count))
      : 0,
  }
}

export async function getSavingsTransactions(accountId: string) {
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.reference_id, accountId))
    .orderBy(desc(transactions.created_at))
    .limit(50)
}

export async function getMembersForSavings(saccoId: string) {
  return await db
    .select({
      id: members.id,
      full_name: members.full_name,
      member_code: members.member_code,
      phone: members.phone,
    })
    .from(members)
    .where(eq(members.sacco_id, saccoId))
    .orderBy(members.full_name)
}

export async function getSavingsCategoriesForSelect(saccoId: string) {
  return await db
    .select()
    .from(savingsCategories)
    .where(eq(savingsCategories.sacco_id, saccoId))
}

export async function getSavingsById(id: string, saccoId: string) {
  const [account] = await db
    .select({
      id: savingsAccounts.id,
      sacco_id: savingsAccounts.sacco_id,
      member_id: savingsAccounts.member_id,
      category_id: savingsAccounts.category_id,
      account_number: savingsAccounts.account_number,
      balance: savingsAccounts.balance,
      account_type: savingsAccounts.account_type,
      is_locked: savingsAccounts.is_locked,
      lock_until: savingsAccounts.lock_until,
      lock_reason: savingsAccounts.lock_reason,
      created_at: savingsAccounts.created_at,
      updated_at: savingsAccounts.updated_at,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
    })
    .from(savingsAccounts)
    .leftJoin(members, eq(savingsAccounts.member_id, members.id))
    .where(
      and(eq(savingsAccounts.id, id), eq(savingsAccounts.sacco_id, saccoId))
    )
  return account
}
