// app/(dashboard)/loans/components/interest-rate-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import {
  addInterestRate,
  updateInterestRate,
  deleteInterestRate,
  getActiveInterestRates,
  CreateInterestRateInput,
  UpdateInterestRateInput,
} from "@/db/queries/interest-rates"

export type InterestRateActionState = {
  success?: boolean
  error?: string
}

// ─── Add Interest Rate ────────────────────────────────────────────────────────

export async function addInterestRateAction(
  data: CreateInterestRateInput
): Promise<InterestRateActionState> {
  try {
    await addInterestRate(data)
    revalidatePath("/loans")
    return { success: true }
  } catch (error) {
    console.error("Error in addInterestRateAction:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to add interest rate",
    }
  }
}

// ─── Update Interest Rate ─────────────────────────────────────────────────────

export async function updateInterestRateAction(
  id: string,
  data: UpdateInterestRateInput
): Promise<InterestRateActionState> {
  try {
    await updateInterestRate(id, data)
    revalidatePath("/loans")
    return { success: true }
  } catch (error) {
    console.error("Error in updateInterestRateAction:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to update interest rate",
    }
  }
}

// ─── Delete Interest Rate ─────────────────────────────────────────────────────

// ─── Get Interest Rates ─────────────────────────────────────────────────────

export async function getInterestRatesAction() {
  try {
    const rates = await getActiveInterestRates()
    return rates
  } catch (error) {
    console.error("Error in getInterestRatesAction:", error)
    throw new Error("Failed to get interest rates")
  }
}

// ─── Delete Interest Rate ─────────────────────────────────────────────────────

export async function deleteInterestRateAction(
  id: string
): Promise<InterestRateActionState> {
  try {
    await deleteInterestRate(id)
    revalidatePath("/loans")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteInterestRateAction:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to delete interest rate",
    }
  }
}
