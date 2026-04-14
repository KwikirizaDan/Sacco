"use server"

import { getCurrentUser } from "@/lib/auth"
import { smartDb } from "@/lib/db/database-adapter"
import {
  saccos,
  interestRates,
  loanCategories,
  savingsCategories,
  fineCategories,
} from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { z } from "zod"

export type SettingsState = {
  success?: boolean
  error?: string
  url?: string
}

// ─── Update General Settings ──────────────────────────────────────────────────

export async function updateGeneralSettingsAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    await smartDb
      .update(saccos)
      .set({
        name: formData.get("name") as string,
        contact_email: (formData.get("contact_email") as string) || null,
        contact_phone: (formData.get("contact_phone") as string) || null,
        address: (formData.get("address") as string) || null,
        primary_color: (formData.get("primary_color") as string) || "#16a34a",
        updated_at: new Date(),
      })
      .where(eq(saccos.id, user.saccoId))

    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update settings." }
  }
}

// ─── Upload Logo ──────────────────────────────────────────────────────────────

export async function uploadLogoAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const file = formData.get("logo") as File
    if (!file) return { error: "No file provided." }

    const blob = await put(`logos/${user.saccoId}-logo`, file, {
      access: "public",
    })

    await smartDb
      .update(saccos)
      .set({
        logo_url: blob.url,
        updated_at: new Date(),
      })
      .where(eq(saccos.id, user.saccoId))

    revalidatePath("/settings")
    return { success: true, url: blob.url }
  } catch (err) {
    console.error(err)
    return { error: "Failed to upload logo." }
  }
}

// ─── Add Interest Rate ────────────────────────────────────────────────────────

export async function addInterestRateAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const min = parseInt(formData.get("min_amount") as string) * 100
    const max = parseInt(formData.get("max_amount") as string) * 100
    const rate = formData.get("rate") as string
    const rate_type = formData.get("rate_type") as
      | "daily"
      | "monthly"
      | "annual"

    if (min >= max) return { error: "Min amount must be less than max amount." }

    await smartDb.insert(interestRates).values({
      sacco_id: user.saccoId,
      min_amount: min,
      max_amount: max,
      rate,
      rate_type,
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add interest rate." }
  }
}

// ─── Delete Interest Rate ─────────────────────────────────────────────────────

export async function deleteInterestRateAction(
  id: string
): Promise<SettingsState> {
  try {
    await smartDb.delete(interestRates).where(eq(interestRates.id, id))
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete interest rate." }
  }
}

// ─── Add Loan Category ────────────────────────────────────────────────────────

export async function addLoanCategoryAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    await smartDb.insert(loanCategories).values({
      sacco_id: user.saccoId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      min_amount: parseInt(formData.get("min_amount") as string) * 100 || 0,
      max_amount: parseInt(formData.get("max_amount") as string) * 100,
      interest_rate: (formData.get("interest_rate") as string) || "0",
      max_duration_months:
        parseInt(formData.get("max_duration_months") as string) || 12,
      requires_guarantor: formData.get("requires_guarantor") === "true",
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add loan category." }
  }
}

// ─── Delete Loan Category ─────────────────────────────────────────────────────

export async function deleteLoanCategoryAction(
  id: string
): Promise<SettingsState> {
  try {
    await smartDb.delete(loanCategories).where(eq(loanCategories.id, id))
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete loan category." }
  }
}

// ─── Add Savings Category ─────────────────────────────────────────────────────

export async function addSavingsCategoryAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    await smartDb.insert(savingsCategories).values({
      sacco_id: user.saccoId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      interest_rate: (formData.get("interest_rate") as string) || "0",
      is_fixed: formData.get("is_fixed") === "true",
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add savings category." }
  }
}

// ─── Delete Savings Category ──────────────────────────────────────────────────

export async function deleteSavingsCategoryAction(
  id: string
): Promise<SettingsState> {
  try {
    await smartDb.delete(savingsCategories).where(eq(savingsCategories.id, id))
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete savings category." }
  }
}

// ─── Add Fine Category ────────────────────────────────────────────────────────

export async function addFineCategoryAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    await smartDb.insert(fineCategories).values({
      sacco_id: user.saccoId,
      name: formData.get("name") as string,
      default_amount:
        parseInt(formData.get("default_amount") as string) * 100 || 0,
    })
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to add fine category." }
  }
}

// ─── Delete Fine Category ─────────────────────────────────────────────────────

export async function deleteFineCategoryAction(
  id: string
): Promise<SettingsState> {
  try {
    await smartDb.delete(fineCategories).where(eq(fineCategories.id, id))
    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete fine category." }
  }
}

// ─── Test Flutterwave Charge ──────────────────────────────────────────────────

export async function testFlutterwaveChargeAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const phone = formData.get("phone") as string
    const amount = parseInt(formData.get("amount") as string) * 100

    if (!phone || !amount) return { error: "Phone and amount required." }

    const { initiateFlutterwaveCharge } =
      await import("@/lib/payments/flutterwave")

    await initiateFlutterwaveCharge({
      phone_number: phone,
      amount: amount / 100,
      currency: "UGX",
      tx_ref: `TEST-CHARGE-${Date.now()}`,
      narration: "Test payment charge",
      fullname: "Test User",
    })

    return { success: true }
  } catch (err) {
    console.error("Test charge failed:", err)
    return { error: err instanceof Error ? err.message : "Test charge failed" }
  }
}

// ─── Test Flutterwave Transfer ─────────────────────────────────────────────────

export async function testFlutterwaveTransferAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const phone = formData.get("phone") as string
    const amount = parseInt(formData.get("amount") as string) * 100

    if (!phone || !amount) return { error: "Phone and amount required." }

    const { initiateFlutterwaveTransfer } =
      await import("@/lib/payments/flutterwave")

    const normalizedPhone = phone
      .replace(/\s+/g, "")
      .replace(/^\+/, "")
      .replace(/^0/, "256")
    const account_bank =
      normalizedPhone.startsWith("25675") || normalizedPhone.startsWith("25670")
        ? "MPS"
        : "ATL"

    await initiateFlutterwaveTransfer({
      account_bank,
      account_number: normalizedPhone,
      amount: amount / 100,
      currency: "UGX",
      narration: "Test payment transfer",
      reference: `TEST-TRANSFER-${Date.now()}`,
      beneficiary_name: "Test User",
    })

    return { success: true }
  } catch (err) {
    console.error("Test transfer failed:", err)
    return {
      error: err instanceof Error ? err.message : "Test transfer failed",
    }
  }
}

// ─── Update Payment Settings ──────────────────────────────────────────────────

export async function updatePaymentSettingsAction(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    const existing = await smartDb
      .select(saccos)
      .where(eq(saccos.id, user.saccoId))

    const currentSettings = JSON.parse(existing[0]?.settings ?? "{}")

    const newSettings = {
      ...currentSettings,
      payments: {
        mtn_enabled: formData.get("mtn_enabled") === "true",
        airtel_enabled: formData.get("airtel_enabled") === "true",
        flutterwave_enabled: formData.get("flutterwave_enabled") === "true",
        default_method: formData.get("default_method") as string,
      },
      sms: {
        provider: formData.get("sms_provider") as string,
        sender_id: formData.get("sender_id") as string,
      },
    }

    await smartDb
      .update(saccos)
      .set({ settings: JSON.stringify(newSettings), updated_at: new Date() })
      .where(eq(saccos.id, user.saccoId))

    revalidatePath("/settings")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to update payment settings." }
  }
}
