// app/(dashboard)/loans/actions.ts (Complete)
"use server"

import { smartDb } from "@/lib/db/database-adapter"
import {
  loans,
  members,
  transactions,
  interestRates,
  type InterestRate,
} from "@/db/schema"
import { revalidatePath } from "next/cache"
import { sendSms, smsTemplates } from "@/lib/sms"
import { SACCO_ID } from "@/lib/constants"
import {
  calculateLoan,
  getInterestRateForAmount,
} from "@/lib/pdf/loan-calculator"
import {
  initiateFlutterwaveTransfer,
  initiateFlutterwaveCharge,
} from "@/lib/payments/flutterwave"
import { z } from "zod"
import { eq } from "drizzle-orm"

export type LoanFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const loanSchema = z.object({
  member_id: z.string().uuid("Please select a member"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  duration_months: z.coerce.number().min(1).default(12),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
})

// ─── Add Loan ─────────────────────────────────────────────────────────────────

export async function addLoanAction(
  prevState: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  try {
    const raw = {
      member_id: formData.get("member_id") as string,
      amount: formData.get("amount") as string,
      duration_months: formData.get("duration_months") as string,
      due_date: formData.get("due_date") as string,
      notes: formData.get("notes") as string,
    }

    const parsed = loanSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    // Get member
    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, parsed.data.member_id))

    if (!member) return { error: "Member not found." }

    const amountInCents = Math.floor(parsed.data.amount * 100)

    // Get applicable interest rate from interest_rates table
    const interestRatesList = await smartDb
      .select(interestRates)
      .where(eq(interestRates.sacco_id, SACCO_ID))

    const { rate: interestRate, rateType: interestType } =
      getInterestRateForAmount(amountInCents, interestRatesList)

    // Calculate loan details
    const calc = calculateLoan({
      principal: amountInCents,
      interestRate: interestRate,
      interestType: interestType as "daily" | "monthly" | "annual",
      durationMonths: parsed.data.duration_months,
    })

    const loan_ref = `LN-${Date.now()}`

    // Get the interest rate ID
    const applicableRate = interestRatesList.find(
      (rate: InterestRate) =>
        amountInCents >= rate.min_amount && amountInCents <= rate.max_amount
    )

    // Insert loan
    await smartDb.insert(loans).values({
      sacco_id: SACCO_ID,
      member_id: parsed.data.member_id,
      interest_rate_id: applicableRate?.id,
      loan_ref,
      amount: amountInCents,
      expected_received: calc.totalExpectedReceived,
      balance: calc.totalExpectedReceived,
      interest_rate: String(interestRate),
      interest_type: interestType,
      duration_months: parsed.data.duration_months,
      late_penalty_fee: calc.latePenaltyFee,
      daily_payment: calc.dailyPayment,
      monthly_payment: calc.monthlyPayment,
      due_date: parsed.data.due_date,
      notes: parsed.data.notes || null,
      status: "pending",
    })

    // Send SMS notification (don't fail if SMS fails)
    if (member.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: `Dear ${member.full_name}, your loan application of UGX ${(amountInCents / 100).toLocaleString()} has been submitted. Ref: ${loan_ref}. Expected to receive: UGX ${(calc.totalExpectedReceived / 100).toLocaleString()}. Awaiting approval. - SACCO`,
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    revalidatePath("/members")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add loan. Please try again." }
  }
}

// ─── Approve Loan ─────────────────────────────────────────────────────────────

export async function approveLoanAction(id: string): Promise<LoanFormState> {
  try {
    const [loan] = await smartDb.select(loans).where(eq(loans.id, id))

    if (!loan) return { error: "Loan not found." }

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, loan.member_id))

    await smartDb
      .update(loans)
      .set({ status: "approved", updated_at: new Date() })
      .where(eq(loans.id, id))

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.loanApproved(
            member.full_name,
            loan.amount / 100,
            member.member_code
          ),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to approve loan." }
  }
}

// ─── Decline Loan ─────────────────────────────────────────────────────────────

export async function declineLoanAction(
  id: string,
  reason: string
): Promise<LoanFormState> {
  try {
    const [loan] = await smartDb.select(loans).where(eq(loans.id, id))

    if (!loan) return { error: "Loan not found." }

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, loan.member_id))

    await smartDb
      .update(loans)
      .set({
        status: "declined",
        decline_reason: reason,
        updated_at: new Date(),
      })
      .where(eq(loans.id, id))

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.loanDeclined(member.full_name, reason),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to decline loan." }
  }
}

// ─── Disburse Loan ────────────────────────────────────────────────────────────

export async function disburseLoanAction(id: string): Promise<LoanFormState> {
  try {
    const [loan] = await smartDb.select(loans).where(eq(loans.id, id))

    if (!loan) return { error: "Loan not found." }
    if (loan.status !== "approved")
      return { error: "Loan must be approved first." }

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, loan.member_id))

    await smartDb
      .update(loans)
      .set({
        status: "disbursed",
        disbursed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(loans.id, id))

    await smartDb.insert(transactions).values({
      sacco_id: SACCO_ID,
      member_id: loan.member_id,
      type: "loan_disbursement",
      amount: loan.amount,
      narration: `Loan disbursement - ${loan.loan_ref}`,
      payment_method: "flutterwave",
    })

    // Initiate Flutterwave transfer to member's phone
    if (member?.phone) {
      try {
        const normalizedPhone = member.phone
          .replace(/\s+/g, "")
          .replace(/^\+/, "")
          .replace(/^0/, "256")
        // Assume MTN for now, can be improved to detect network
        const account_bank =
          normalizedPhone.startsWith("25675") ||
          normalizedPhone.startsWith("25670")
            ? "MPS"
            : "ATL"
        await initiateFlutterwaveTransfer({
          account_bank,
          account_number: normalizedPhone,
          amount: loan.amount / 100,
          currency: "UGX",
          narration: `Loan disbursement - ${loan.loan_ref}`,
          reference: `DISB-${loan.id}`,
          beneficiary_name: member.full_name,
        })
      } catch (transferError) {
        console.error("[Loan] Flutterwave transfer failed:", transferError)
        // Still proceed, maybe mark as pending transfer
      }

      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.loanDisbursed(
            member.full_name,
            `UGX ${(loan.amount / 100).toLocaleString()}`,
            loan.loan_ref
          ),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to disburse loan." }
  }
}

// ─── Make Repayment ───────────────────────────────────────────────────────────

export async function repayLoanAction(
  prevState: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  try {
    const id = formData.get("loan_id") as string
    const amountStr = (formData.get("amount") as string)?.replace(/,/g, "")
    const amount = Math.round(parseFloat(amountStr || "0") * 100)
    const payment_method = (formData.get("payment_method") as string) || "cash"

    if (!amountStr || isNaN(amount) || amount <= 0)
      return { error: "Valid amount required." }

    const [loan] = await smartDb.select(loans).where(eq(loans.id, id))

    if (!loan) return { error: "Loan not found." }
    if (loan.status !== "disbursed" && loan.status !== "active")
      return { error: "Loan must be disbursed to record repayments." }

    const [member] = await smartDb
      .select(members)
      .where(eq(members.id, loan.member_id))

    // Process payment if mobile money
    if (payment_method === "mobile_money" && member?.phone) {
      try {
        await initiateFlutterwaveCharge({
          phone_number: member.phone,
          amount: amount / 100,
          currency: "UGX",
          tx_ref: `LOAN-REPAY-${loan.id}-${Date.now()}`,
          narration: `Loan repayment - ${loan.loan_ref}`,
          fullname: member.full_name,
        })
      } catch (chargeError) {
        console.error(
          "[Loan Repayment] Flutterwave charge failed:",
          chargeError
        )
        return {
          error:
            "Payment processing failed. Please try again or contact support.",
        }
      }
    }

    const newBalance = Math.max(0, loan.balance - amount)
    const newStatus = newBalance === 0 ? "settled" : "active"

    await smartDb
      .update(loans)
      .set({
        balance: newBalance,
        status: newStatus,
        settled_at: newBalance === 0 ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(loans.id, id))

    await smartDb.insert(transactions).values({
      sacco_id: SACCO_ID,
      member_id: loan.member_id,
      type: "loan_repayment",
      amount,
      balance_after: newBalance,
      narration: `Loan repayment - ${loan.loan_ref}`,
      payment_method:
        payment_method === "mobile_money" ? "flutterwave" : payment_method,
    })

    if (member?.phone) {
      try {
        await sendSms({
          to: member.phone,
          message: smsTemplates.loanRepayment(
            member.full_name,
            `UGX ${(amount / 100).toLocaleString()}`,
            `UGX ${(newBalance / 100).toLocaleString()}`
          ),
        })
      } catch (smsError) {
        console.error("[Loan] SMS notification failed:", smsError)
      }
    }

    revalidatePath("/loans")
    revalidatePath(`/members/${loan.member_id}`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to record repayment." }
  }
}

// ─── Delete Loan ──────────────────────────────────────────────────────────────

export async function deleteLoanAction(id: string): Promise<LoanFormState> {
  try {
    await smartDb.delete(loans).where(eq(loans.id, id))
    revalidatePath("/loans")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete loan." }
  }
}
