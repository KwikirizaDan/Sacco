"use server"

import { getCurrentUser } from "@/lib/auth"
import { smartDb } from "@/lib/db/database-adapter"
import {
  savingsAccounts,
  transactions,
  members,
  loans,
  savingsCategories,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { sendSms, smsTemplates } from "@/lib/sms"
import { initiateFlutterwaveTransfer } from "@/lib/payments/flutterwave"
import { z } from "zod"

export type SavingsFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ─── Create Savings Account ───────────────────────────────────────────────────

export async function createSavingsAccountAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const member_id = formData.get("member_id") as string
    const category_id = formData.get("category_id") as string
    const account_type = formData.get("account_type") as string
    const initial_deposit =
      parseInt(formData.get("initial_deposit") as string) * 100 || 0

    if (!member_id) return { error: "Please select a member." }

    const existing = await smartDb
      .select(savingsAccounts)
      .where(
        and(
          eq(savingsAccounts.member_id, member_id),
          eq(savingsAccounts.sacco_id, user.saccoId)
        )
      )

    if (existing.length > 0) {
      return { error: "Member already has a savings account." }
    }

    const account_number = `SAV-${Date.now()}`

    const [account] = await smartDb
      .insert(savingsAccounts)
      .values({
        sacco_id: user.saccoId,
        member_id,
        category_id: category_id || null,
        account_number,
        balance: initial_deposit,
        account_type: (account_type as "regular" | "fixed") || "regular",
      })
      .returning()

    if (initial_deposit > 0) {
      await smartDb.insert(transactions).values({
        sacco_id: user.saccoId,
        member_id,
        type: "savings_deposit",
        amount: initial_deposit,
        balance_after: initial_deposit,
        reference_id: account.id,
        narration: "Initial deposit",
        payment_method: "flutterwave",
      })

      const [member] = await smartDb
        .select(members)
        .where(eq(members.id, member_id))

      if (member?.phone) {
        try {
          await sendSms({
            to: member.phone,
            message: smsTemplates.savingsDeposit(
              member.full_name,
              initial_deposit / 100,
              initial_deposit / 100,
              member.member_code
            ),
          })
        } catch (smsError) {
          console.error("[Savings] SMS notification failed:", smsError)
        }
      }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to create savings account." }
  }
}

// ─── Deposit ──────────────────────────────────────────────────────────────────

export async function depositAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const account_id = formData.get("account_id") as string
    const amount = parseInt(formData.get("amount") as string) * 100
    const narration = formData.get("narration") as string
    const payment_method = formData.get("payment_method") as string

    if (!amount || amount <= 0) return { error: "Enter a valid amount." }

    const [account] = await smartDb
      .select(savingsAccounts)
      .where(
        and(
          eq(savingsAccounts.id, account_id),
          eq(savingsAccounts.sacco_id, user.saccoId)
        )
      )

    if (!account) return { error: "Account not found." }
    if (account.is_locked) return { error: "This account is locked." }

    const newBalance = account.balance + amount

    await smartDb
      .update(savingsAccounts)
      .set({ balance: newBalance, updated_at: new Date() })
      .where(eq(savingsAccounts.id, account_id))

    await smartDb.insert(transactions).values({
      sacco_id: user.saccoId,
      member_id: account.member_id,
      type: "savings_deposit",
      amount,
      balance_after: newBalance,
      reference_id: account_id,
      narration: narration || "Savings deposit",
      payment_method: (payment_method as any) || "flutterwave",
    })

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, account.member_id))

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.savingsDeposit(
            member.full_name,
            amount / 100,
            newBalance / 100,
            member.member_code
          ),
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to process deposit." }
  }
}

// ─── Withdraw ─────────────────────────────────────────────────────────────────

export async function withdrawAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const account_id = formData.get("account_id") as string
    const amount = parseInt(formData.get("amount") as string) * 100
    const narration = formData.get("narration") as string
    const payment_method = (formData.get("payment_method") as string) || "cash"

    if (!amount || amount <= 0) return { error: "Enter a valid amount." }

    const [account] = await smartDb
      .select(savingsAccounts)
      .where(
        and(
          eq(savingsAccounts.id, account_id),
          eq(savingsAccounts.sacco_id, user.saccoId)
        )
      )

    if (!account) return { error: "Account not found." }
    if (account.is_locked)
      return { error: "This account is locked. Unlock it first." }
    if (account.balance < amount) return { error: "Insufficient balance." }

    const newBalance = account.balance - amount

    await smartDb
      .update(savingsAccounts)
      .set({ balance: newBalance, updated_at: new Date() })
      .where(eq(savingsAccounts.id, account_id))

    await smartDb.insert(transactions).values({
      sacco_id: user.saccoId,
      member_id: account.member_id,
      type: "savings_withdrawal",
      amount,
      balance_after: newBalance,
      reference_id: account_id,
      narration: narration || "Savings withdrawal",
      payment_method:
        payment_method === "mobile_money" ? "flutterwave" : payment_method,
    })

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, account.member_id))

    // Initiate Flutterwave transfer to member's phone
    if (member?.phone) {
      try {
        const normalizedPhone = member.phone
          .replace(/\s+/g, "")
          .replace(/^\+/, "")
          .replace(/^0/, "256")
        const account_bank =
          normalizedPhone.startsWith("25675") ||
          normalizedPhone.startsWith("25670")
            ? "MPS"
            : "ATL"
        await initiateFlutterwaveTransfer({
          account_bank,
          account_number: normalizedPhone,
          amount: amount / 100,
          currency: "UGX",
          narration: narration || "Savings withdrawal",
          reference: `WD-${account_id}-${Date.now()}`,
          beneficiary_name: member.full_name,
        })
      } catch (transferError) {
        console.error("[Savings] Flutterwave transfer failed:", transferError)
      }

      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, withdrawal of UGX ${(amount / 100).toLocaleString()} processed. New balance: UGX ${(newBalance / 100).toLocaleString()}. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to process withdrawal." }
  }
}

// ─── Lock Account ─────────────────────────────────────────────────────────────

export async function lockAccountAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const account_id = formData.get("account_id") as string
    const lock_until = formData.get("lock_until") as string
    const lock_reason = formData.get("lock_reason") as string

    if (!lock_until) return { error: "Please set a lock expiry date." }

    const [account] = await smartDb
      .select(savingsAccounts)
      .where(eq(savingsAccounts.id, account_id))

    if (!account) return { error: "Account not found." }

    await smartDb
      .update(savingsAccounts)
      .set({
        is_locked: true,
        lock_until,
        lock_reason: lock_reason || null,
        updated_at: new Date(),
      })
      .where(eq(savingsAccounts.id, account_id))

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, account.member_id))

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your savings account ${account.account_number} has been locked until ${lock_until}. Reason: ${lock_reason || "N/A"}. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to lock account." }
  }
}

// ─── Unlock Account ───────────────────────────────────────────────────────────

export async function unlockAccountAction(
  id: string
): Promise<SavingsFormState> {
  try {
    const [account] = await smartDb
      .select(savingsAccounts)
      .where(eq(savingsAccounts.id, id))

    if (!account) return { error: "Account not found." }

    await smartDb
      .update(savingsAccounts)
      .set({
        is_locked: false,
        lock_until: null,
        lock_reason: null,
        updated_at: new Date(),
      })
      .where(eq(savingsAccounts.id, id))

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, account.member_id))

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your savings account ${account.account_number} has been unlocked. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to unlock account." }
  }
}

// ─── Trim to Loan ─────────────────────────────────────────────────────────────

export async function trimToLoanAction(
  prevState: SavingsFormState,
  formData: FormData
): Promise<SavingsFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const account_id = formData.get("account_id") as string
    const loan_id = formData.get("loan_id") as string
    const amount = parseInt(formData.get("amount") as string) * 100

    if (!amount || amount <= 0) return { error: "Enter a valid amount." }
    if (!loan_id) return { error: "Please select a loan." }

    const [account] = await smartDb
      .select(savingsAccounts)
      .where(
        and(
          eq(savingsAccounts.id, account_id),
          eq(savingsAccounts.sacco_id, user.saccoId)
        )
      )

    if (!account) return { error: "Account not found." }
    if (account.is_locked) return { error: "Account is locked." }
    if (account.balance < amount)
      return { error: "Insufficient savings balance." }

    const [loan] = await smartDb
      .select(loans)
      .where(and(eq(loans.id, loan_id), eq(loans.sacco_id, user.saccoId)))

    if (!loan) return { error: "Loan not found." }

    const repayAmount = Math.min(amount, loan.balance)
    const newSavingsBalance = account.balance - repayAmount
    const newLoanBalance = loan.balance - repayAmount

    await smartDb
      .update(savingsAccounts)
      .set({ balance: newSavingsBalance, updated_at: new Date() })
      .where(eq(savingsAccounts.id, account_id))

    await smartDb
      .update(loans)
      .set({
        balance: newLoanBalance,
        status: newLoanBalance === 0 ? "settled" : "active",
        settled_at: newLoanBalance === 0 ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(loans.id, loan_id))

    await smartDb.insert(transactions).values({
      sacco_id: user.saccoId,
      member_id: account.member_id,
      type: "loan_repayment",
      amount: repayAmount,
      balance_after: newSavingsBalance,
      reference_id: loan_id,
      narration: `Loan repayment from savings - ${loan.loan_ref}`,
      payment_method: "flutterwave",
    })

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, account.member_id))

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, UGX ${(repayAmount / 100).toLocaleString()} trimmed from savings to loan ${loan.loan_ref}. Loan balance: UGX ${(newLoanBalance / 100).toLocaleString()}. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Savings] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/savings")
    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to trim savings to loan." }
  }
}

// ─── Get Savings Categories For Select ──────────────────────────────────────

export async function getSavingsCategoriesForSelect(): Promise<any[]> {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const categories = await smartDb
      .select(savingsCategories)
      .where(eq(savingsCategories.sacco_id, user.saccoId))
    return categories
  } catch (err) {
    console.error(err)
    return []
  }
}

// ─── Get Members For Savings ─────────────────────────────────────────────────

export async function getMembersForSavings(): Promise<any[]> {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const membersList = await smartDb
      .select({
        id: members.id,
        full_name: members.full_name,
        member_code: members.member_code,
        phone: members.phone,
      })
      .from(members)
      .where(eq(members.sacco_id, user.saccoId))
      .orderBy(members.full_name)
    return membersList
  } catch (err) {
    console.error(err)
    return []
  }
}

// ─── Get Savings By ID ───────────────────────────────────────────────────────

export async function getSavingsById(id: string): Promise<any | null> {
  try {
    const [account] = await smartDb
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
      .where(eq(savingsAccounts.id, id))
    return account
  } catch (err) {
    console.error(err)
    return null
  }
}

// ─── Get Savings Transactions ─────────────────────────────────────────────────

export async function getSavingsTransactions(
  accountId: string
): Promise<any[]> {
  try {
    const transactionsList = await smartDb
      .select(transactions)
      .where(eq(transactions.reference_id, accountId))
      .orderBy(transactions.created_at)
      .limit(50)

    return transactionsList
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function getSavingsTransactionsAction(
  accountId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const transactionsList = await smartDb
      .select(transactions)
      .where(eq(transactions.reference_id, accountId))
      .orderBy(transactions.created_at)
      .limit(50)

    return { success: true, data: transactionsList }
  } catch (err) {
    console.error(err)
    return { success: false, error: "Failed to fetch transactions." }
  }
}

// ─── Delete Savings Account ───────────────────────────────────────────────────

export async function deleteSavingsAccountAction(
  id: string
): Promise<SavingsFormState> {
  try {
    const [account] = await smartDb
      .select(savingsAccounts)
      .where(eq(savingsAccounts.id, id))

    if (!account) return { error: "Account not found." }

    await smartDb.delete(savingsAccounts).where(eq(savingsAccounts.id, id))

    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete savings account." }
  }
}

// ─── Update Savings Account ───────────────────────────────────────────────────

export async function updateSavingsAction(
  id: string,
  data: {
    category_id?: string | null
    account_type?: "regular" | "fixed"
  }
): Promise<SavingsFormState> {
  try {
    const [account] = await smartDb
      .select(savingsAccounts)
      .where(eq(savingsAccounts.id, id))

    if (!account) return { error: "Account not found." }

    await smartDb
      .update(savingsAccounts)
      .set({
        category_id: data.category_id ?? account.category_id,
        account_type: data.account_type ?? account.account_type,
        updated_at: new Date(),
      })
      .where(eq(savingsAccounts.id, id))

    revalidatePath("/savings")
    revalidatePath(`/savings/${id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update savings account." }
  }
}
