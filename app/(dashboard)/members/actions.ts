"use server"

import { smartDb } from "@/lib/db/database-adapter"
import {
  members,
  loans,
  savingsAccounts,
  fines,
  transactions,
  notifications,
  type Loan,
  type SavingsAccount,
  type Fine,
  type Transaction,
} from "@/db/schema"
import { revalidatePath } from "next/cache"
import { generateMemberCode } from "@/lib/member-code"
import { sendSms, smsTemplates } from "@/lib/sms"
import { getCurrentUser } from "@/lib/auth"
import { calculateLoan } from "@/lib/pdf/loan-calculator"
import { z } from "zod"
import { eq, and, desc } from "drizzle-orm"

// ─── Schema ───────────────────────────────────────────────────────────────────

const memberSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(9, "Valid phone number required"),
  national_id: z.string().min(5, "National ID is required"),
  date_of_birth: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  address: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  next_of_kin: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  next_of_kin_phone: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  status: z.enum(["active", "suspended", "exited"]).default("active"),
  photo_url: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemberFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ─── Add Member ───────────────────────────────────────────────────────────────

export async function addMemberAction(
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const raw = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      national_id: formData.get("national_id") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      address: formData.get("address") as string,
      next_of_kin: formData.get("next_of_kin") as string,
      next_of_kin_phone: formData.get("next_of_kin_phone") as string,
      status: (formData.get("status") as string) || "active",
      photo_url: formData.get("photo_url") as string,
    }

    const parsed = memberSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const member_code = await generateMemberCode()

    await smartDb.insert(members).values({
      member_code,
      sacco_id: user.saccoId,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      national_id: parsed.data.national_id,
      date_of_birth: parsed.data.date_of_birth || null,
      address: parsed.data.address || null,
      next_of_kin: parsed.data.next_of_kin || null,
      next_of_kin_phone: parsed.data.next_of_kin_phone || null,
      status: parsed.data.status,
      photo_url: parsed.data.photo_url || null,
    })

    if (parsed.data.phone) {
      await sendSms({
        to: parsed.data.phone,
        message: smsTemplates.welcome(parsed.data.full_name, member_code),
      })
    }

    revalidatePath("/members")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add member. Please try again." }
  }
}

// ─── Edit Member ──────────────────────────────────────────────────────────────

export async function editMemberAction(
  id: string,
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const raw = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      national_id: formData.get("national_id") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      address: formData.get("address") as string,
      next_of_kin: formData.get("next_of_kin") as string,
      next_of_kin_phone: formData.get("next_of_kin_phone") as string,
      status: (formData.get("status") as string) || "active",
      photo_url: formData.get("photo_url") as string,
    }

    const parsed = memberSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const [existing] = await smartDb.select(members).where(eq(members.id, id))

    if (!existing) return { error: "Member not found." }

    await smartDb
      .update(members)
      .set({
        full_name: parsed.data.full_name,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        national_id: parsed.data.national_id,
        date_of_birth: parsed.data.date_of_birth || null,
        address: parsed.data.address || null,
        next_of_kin: parsed.data.next_of_kin || null,
        next_of_kin_phone: parsed.data.next_of_kin_phone || null,
        status: parsed.data.status,
        photo_url: parsed.data.photo_url || null,
        updated_at: new Date(),
      })
      .where(eq(members.id, id))

    if (parsed.data.phone && parsed.data.phone !== existing.phone) {
      await sendSms({
        to: parsed.data.phone,
        message: `Dear ${parsed.data.full_name}, your SACCO profile has been updated. Member code: ${existing.member_code}. - SACCO`,
      })
    }

    revalidatePath("/members")
    revalidatePath(`/members/${id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update member. Please try again." }
  }
}

// ─── Delete Member ────────────────────────────────────────────────────────────

export async function deleteMemberAction(id: string): Promise<MemberFormState> {
  try {
    const [existing] = await smartDb.select(members).where(eq(members.id, id))

    if (!existing) return { error: "Member not found." }

    const memberLoans = await smartDb
      .select(loans)
      .where(eq(loans.member_id, id))
    const memberSavings = await smartDb
      .select(savingsAccounts)
      .where(eq(savingsAccounts.member_id, id))
    const memberFines = await smartDb
      .select(fines)
      .where(eq(fines.member_id, id))

    const hasActiveLoans = memberLoans.some((l: any) =>
      ["active", "disbursed", "pending"].includes(l.status)
    )
    const hasSavings = memberSavings.some((s: any) => s.balance > 0)
    const hasPendingFines = memberFines.some((f: any) => f.status === "pending")

    if (hasActiveLoans) {
      return {
        error: "Cannot delete member with active loans. Settle loans first.",
      }
    }
    if (hasSavings) {
      return {
        error:
          "Cannot delete member with savings balance. Withdraw funds first.",
      }
    }
    if (hasPendingFines) {
      return {
        error:
          "Cannot delete member with pending fines. Pay or waive fines first.",
      }
    }

    await smartDb.delete(members).where(eq(members.id, id))

    revalidatePath("/members")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete member." }
  }
}

// ─── Update Member Status ─────────────────────────────────────────────────────

export async function updateMemberStatusAction(
  id: string,
  status: "active" | "suspended" | "exited"
): Promise<MemberFormState> {
  try {
    const [existing] = await smartDb.select(members).where(eq(members.id, id))

    if (!existing) return { error: "Member not found." }

    await smartDb
      .update(members)
      .set({ status, updated_at: new Date() })
      .where(eq(members.id, id))

    if (existing.phone) {
      const messages = {
        active: `Dear ${existing.full_name}, your SACCO membership has been activated. Welcome back! - SACCO`,
        suspended: `Dear ${existing.full_name}, your SACCO membership has been suspended. Contact us for more info. - SACCO`,
        exited: `Dear ${existing.full_name}, your SACCO membership has been closed. Thank you for being with us. - SACCO`,
      }
      await sendSms({
        to: existing.phone,
        message: messages[status],
      })
    }

    revalidatePath("/members")
    revalidatePath(`/members/${id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update member status." }
  }
}

// ─── Send SMS to Member ───────────────────────────────────────────────────────

export async function sendMemberSmsAction(
  id: string,
  message: string
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const [member] = await smartDb
      .select(members)
      .where(and(eq(members.id, id), eq(members.sacco_id, user.saccoId)))

    if (!member) return { error: "Member not found." }
    if (!member.phone) return { error: "Member has no phone number." }

    await sendSms({ to: member.phone, message })

    await smartDb.insert(notifications).values({
      sacco_id: user.saccoId,
      member_id: id,
      title: "SMS Sent",
      body: message,
      type: "sms",
      status: "sent",
      sent_at: new Date(),
    })

    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to send SMS." }
  }
}

// ─── Get Member Stats ─────────────────────────────────────────────────────────

export async function getMemberStatsAction(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const memberLoans = await smartDb
      .select(loans)
      .where(and(eq(loans.member_id, id), eq(loans.sacco_id, user.saccoId)))
      .orderBy(desc(loans.created_at))

    const memberSavings = await smartDb
      .select(savingsAccounts)
      .where(
        and(
          eq(savingsAccounts.member_id, id),
          eq(savingsAccounts.sacco_id, user.saccoId)
        )
      )

    const memberFines = await smartDb
      .select(fines)
      .where(and(eq(fines.member_id, id), eq(fines.sacco_id, user.saccoId)))
      .orderBy(desc(fines.created_at))

    const memberTransactions = await smartDb
      .select(transactions)
      .where(
        and(
          eq(transactions.member_id, id),
          eq(transactions.sacco_id, user.saccoId)
        )
      )
      .orderBy(desc(transactions.created_at))
      .limit(20)

    const totalSavings = memberSavings.reduce(
      (sum: number, s: SavingsAccount) => sum + s.balance,
      0
    )
    const activeLoans = memberLoans.filter((l: Loan) => l.status === "active")
    const totalBorrowed = memberLoans.reduce(
      (sum: number, l: Loan) => sum + l.amount,
      0
    )
    const totalRepaid = memberLoans.reduce(
      (sum: number, l: Loan) => sum + (l.amount - l.balance),
      0
    )
    const outstandingBalance = activeLoans.reduce(
      (sum: number, l: Loan) => sum + l.balance,
      0
    )
    const pendingFines = memberFines.filter((f: Fine) => f.status === "pending")
    const totalFines = pendingFines.reduce(
      (sum: number, f: Fine) => sum + f.amount,
      0
    )

    return {
      loans: memberLoans,
      savings: memberSavings,
      fines: memberFines,
      transactions: memberTransactions,
      stats: {
        totalSavings,
        totalLoans: outstandingBalance,
        totalFines: totalFines,
        totalTransactions: memberTransactions.length,
      },
    }
  } catch (err) {
    console.error(err)
    return null
  }
}

// ─── Assign Loan to Member ────────────────────────────────────────────────────

export async function assignLoanAction(
  memberId: string,
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const amount = parseInt(formData.get("amount") as string) * 100
    const interest_rate = formData.get("interest_rate") as string
    const due_date = formData.get("due_date") as string
    const purpose = formData.get("purpose") as string

    if (!amount || amount <= 0) return { error: "Valid amount is required." }
    if (!due_date) return { error: "Due date is required." }

    const [member] = await smartDb
      .select(members)
      .where(and(eq(members.id, memberId), eq(members.sacco_id, user.saccoId)))

    if (!member) return { error: "Member not found." }

    const loan_ref = `LN-${Date.now()}`

    // Calculate loan details
    const calc = calculateLoan({
      principal: amount,
      interestRate: parseFloat(interest_rate || "0"),
      interestType: "monthly",
      durationMonths: 12,
    })

    await smartDb.insert(loans).values({
      sacco_id: user.saccoId,
      member_id: memberId,
      loan_ref,
      amount,
      expected_received: calc.totalExpectedReceived,
      balance: calc.totalExpectedReceived,
      interest_rate: interest_rate || "0",
      status: "pending",
      due_date,
      notes: purpose || null,
    })

    if (member.phone) {
      await sendSms({
        to: member.phone,
        message: `Dear ${member.full_name}, your loan application of UGX ${(amount / 100).toLocaleString()} has been submitted. Ref: ${loan_ref}. Await approval. - SACCO`,
      })
    }

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to assign loan." }
  }
}

// ─── Add Savings to Member ────────────────────────────────────────────────────

export async function addSavingsAction(
  memberId: string,
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized." }

    const amount = parseInt(formData.get("amount") as string) * 100
    const narration = formData.get("narration") as string

    if (!amount || amount <= 0) return { error: "Valid amount is required." }

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, memberId))

    if (!member) return { error: "Member not found." }

    const existingAccounts = await smartDb
      .select(savingsAccounts)
      .where(
        and(
          eq(savingsAccounts.member_id, memberId),
          eq(savingsAccounts.sacco_id, user.saccoId)
        )
      )

    if (existingAccounts.length === 0) {
      const account_number = `SAV-${Date.now()}`
      await smartDb.insert(savingsAccounts).values({
        sacco_id: user.saccoId,
        member_id: memberId,
        account_number,
        balance: amount,
      })
    } else {
      const account = existingAccounts[0]
      await smartDb
        .update(savingsAccounts)
        .set({
          balance: account.balance + amount,
          updated_at: new Date(),
        })
        .where(eq(savingsAccounts.id, account.id))
    }

    await smartDb.insert(transactions).values({
      sacco_id: user.saccoId,
      member_id: memberId,
      type: "savings_deposit",
      amount,
      narration: narration || "Savings deposit",
      payment_method: "cash",
    })

    if (member.phone) {
      await sendSms({
        to: member.phone,
        message: smsTemplates.savingsDeposit(
          member.full_name,
          amount / 100,
          (existingAccounts[0]?.balance ?? 0 + amount) / 100,
          member.member_code
        ),
      })
    }

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    revalidatePath("/savings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add savings." }
  }
}

// ─── Import Members from Excel ────────────────────────────────────────────────

export async function importMembersAction(
  rows: Array<{
    full_name: string
    phone: string
    email: string
    national_id: string
    address: string
  }>
): Promise<MemberFormState & { imported?: number }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized." }

    let imported = 0

    for (const row of rows) {
      const member_code = await generateMemberCode()
      await smartDb.insert(members).values({
        sacco_id: user.saccoId,
        member_code,
        full_name: row.full_name,
        phone: row.phone || null,
        email: row.email || null,
        national_id: row.national_id || null,
        address: row.address || null,
        status: "active",
      })
      imported++
    }

    revalidatePath("/members")
    return { success: true, imported }
  } catch (err) {
    console.error(err)
    return { error: "Failed to import members." }
  }
}
