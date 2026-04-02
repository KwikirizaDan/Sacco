// db/queries/interest-rates.ts
import { db } from "@/db"
import { interestRates, interestTypeEnum } from "@/db/schema"
import { eq, and, desc, sql, between } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"

export interface InterestRateData {
  id?: string
  sacco_id: string
  min_amount: number
  max_amount: number
  rate: string
  rate_type: "daily" | "monthly" | "annual"
  is_active: boolean
  created_at?: Date
  updated_at?: Date
}

export interface CreateInterestRateInput {
  min_amount: number
  max_amount: number
  rate: number
  rate_type: "daily" | "monthly" | "annual"
  is_active?: boolean
}

export interface UpdateInterestRateInput {
  min_amount?: number
  max_amount?: number
  rate?: number
  rate_type?: "daily" | "monthly" | "annual"
  is_active?: boolean
}

/**
 * Get all active interest rates for the current SACCO
 */
export async function getActiveInterestRates() {
  try {
    const rates = await db
      .select()
      .from(interestRates)
      .where(
        and(
          eq(interestRates.sacco_id, SACCO_ID),
          eq(interestRates.is_active, true)
        )
      )
      .orderBy(interestRates.min_amount)
    
    return rates
  } catch (error) {
    console.error("Error fetching active interest rates:", error)
    throw new Error("Failed to fetch active interest rates")
  }
}

/**
 * Get all interest rates (including inactive) for the current SACCO
 */
export async function getAllInterestRates() {
  try {
    const rates = await db
      .select()
      .from(interestRates)
      .where(eq(interestRates.sacco_id, SACCO_ID))
      .orderBy(interestRates.min_amount)
    
    return rates
  } catch (error) {
    console.error("Error fetching all interest rates:", error)
    throw new Error("Failed to fetch interest rates")
  }
}

/**
 * Get interest rate by ID
 */
export async function getInterestRateById(id: string) {
  try {
    const [rate] = await db
      .select()
      .from(interestRates)
      .where(
        and(
          eq(interestRates.id, id),
          eq(interestRates.sacco_id, SACCO_ID)
        )
      )
    
    return rate || null
  } catch (error) {
    console.error("Error fetching interest rate by ID:", error)
    throw new Error("Failed to fetch interest rate")
  }
}

/**
 * Get interest rate for a specific amount
 */
export async function getInterestRateForAmount(amount: number) {
  try {
    const [rate] = await db
      .select()
      .from(interestRates)
      .where(
        and(
          eq(interestRates.sacco_id, SACCO_ID),
          eq(interestRates.is_active, true),
          sql`${amount} BETWEEN ${interestRates.min_amount} AND ${interestRates.max_amount}`
        )
      )
      .limit(1)
    
    return rate || null
  } catch (error) {
    console.error("Error fetching interest rate for amount:", error)
    throw new Error("Failed to fetch interest rate for amount")
  }
}

/**
 * Check if an amount range overlaps with existing rates
 */
export async function checkOverlappingRanges(
  minAmount: number,
  maxAmount: number,
  excludeId?: string
) {
  try {
    const baseCondition = and(
      eq(interestRates.sacco_id, SACCO_ID),
      sql`(
        (${minAmount} BETWEEN ${interestRates.min_amount} AND ${interestRates.max_amount}) OR
        (${maxAmount} BETWEEN ${interestRates.min_amount} AND ${interestRates.max_amount}) OR
        (${minAmount} <= ${interestRates.min_amount} AND ${maxAmount} >= ${interestRates.max_amount})
      )`
    )

    const overlapping = await db
      .select()
      .from(interestRates)
      .where(excludeId ? and(baseCondition, sql`${interestRates.id} != ${excludeId}`) : baseCondition)
    
    return overlapping.length > 0
  } catch (error) {
    console.error("Error checking overlapping ranges:", error)
    throw new Error("Failed to check overlapping ranges")
  }
}

/**
 * Add a new interest rate
 */
export async function addInterestRate(data: CreateInterestRateInput) {
  try {
    // Convert amount from UGX to cents
    const minAmountInCents = Math.floor(data.min_amount * 100)
    const maxAmountInCents = Math.floor(data.max_amount * 100)
    
    // Validate amounts
    if (minAmountInCents >= maxAmountInCents) {
      throw new Error("Minimum amount must be less than maximum amount")
    }
    
    if (minAmountInCents < 0 || maxAmountInCents < 0) {
      throw new Error("Amounts cannot be negative")
    }
    
    // Check for overlapping ranges
    const hasOverlap = await checkOverlappingRanges(minAmountInCents, maxAmountInCents)
    if (hasOverlap) {
      throw new Error("This amount range overlaps with an existing range")
    }
    
    const [newRate] = await db
      .insert(interestRates)
      .values({
        sacco_id: SACCO_ID,
        min_amount: minAmountInCents,
        max_amount: maxAmountInCents,
        rate: data.rate.toString(),
        rate_type: data.rate_type,
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning()
    
    return newRate
  } catch (error) {
    console.error("Error adding interest rate:", error)
    throw error
  }
}

/**
 * Update an existing interest rate
 */
export async function updateInterestRate(
  id: string,
  data: UpdateInterestRateInput
) {
  try {
    // Get existing rate
    const existingRate = await getInterestRateById(id)
    if (!existingRate) {
      throw new Error("Interest rate not found")
    }
    
    const updateData: any = {
      updated_at: new Date(),
    }
    
    // Handle amount updates (convert from UGX to cents)
    if (data.min_amount !== undefined) {
      const minAmountInCents = Math.floor(data.min_amount * 100)
      if (minAmountInCents < 0) {
        throw new Error("Minimum amount cannot be negative")
      }
      updateData.min_amount = minAmountInCents
    }
    
    if (data.max_amount !== undefined) {
      const maxAmountInCents = Math.floor(data.max_amount * 100)
      if (maxAmountInCents < 0) {
        throw new Error("Maximum amount cannot be negative")
      }
      updateData.max_amount = maxAmountInCents
    }
    
    if (data.rate !== undefined) {
      if (data.rate < 0 || data.rate > 100) {
        throw new Error("Interest rate must be between 0 and 100")
      }
      updateData.rate = data.rate.toString()
    }
    
    if (data.rate_type !== undefined) {
      updateData.rate_type = data.rate_type
    }
    
    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active
    }
    
    // Check for overlapping ranges if amounts changed
    const minAmount = updateData.min_amount ?? existingRate.min_amount
    const maxAmount = updateData.max_amount ?? existingRate.max_amount
    
    if (minAmount >= maxAmount) {
      throw new Error("Minimum amount must be less than maximum amount")
    }
    
    const hasOverlap = await checkOverlappingRanges(minAmount, maxAmount, id)
    if (hasOverlap) {
      throw new Error("This amount range overlaps with an existing range")
    }
    
    const [updatedRate] = await db
      .update(interestRates)
      .set(updateData)
      .where(
        and(
          eq(interestRates.id, id),
          eq(interestRates.sacco_id, SACCO_ID)
        )
      )
      .returning()
    
    return updatedRate
  } catch (error) {
    console.error("Error updating interest rate:", error)
    throw error
  }
}

/**
 * Deactivate an interest rate (soft delete)
 */
export async function deactivateInterestRate(id: string) {
  try {
    const [deactivatedRate] = await db
      .update(interestRates)
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(interestRates.id, id),
          eq(interestRates.sacco_id, SACCO_ID)
        )
      )
      .returning()
    
    if (!deactivatedRate) {
      throw new Error("Interest rate not found")
    }
    
    return deactivatedRate
  } catch (error) {
    console.error("Error deactivating interest rate:", error)
    throw new Error("Failed to deactivate interest rate")
  }
}

/**
 * Activate an interest rate
 */
export async function activateInterestRate(id: string) {
  try {
    const [activatedRate] = await db
      .update(interestRates)
      .set({
        is_active: true,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(interestRates.id, id),
          eq(interestRates.sacco_id, SACCO_ID)
        )
      )
      .returning()
    
    if (!activatedRate) {
      throw new Error("Interest rate not found")
    }
    
    return activatedRate
  } catch (error) {
    console.error("Error activating interest rate:", error)
    throw new Error("Failed to activate interest rate")
  }
}

/**
 * Delete an interest rate (hard delete - use with caution)
 */
export async function deleteInterestRate(id: string) {
  try {
    // Check if any loans are using this interest rate
    const { loans } = await import("@/db/schema")
    const [loanWithRate] = await db
      .select()
      .from(loans)
      .where(eq(loans.interest_rate_id, id))
      .limit(1)
    
    if (loanWithRate) {
      throw new Error("Cannot delete interest rate that is being used by existing loans")
    }
    
    const [deletedRate] = await db
      .delete(interestRates)
      .where(
        and(
          eq(interestRates.id, id),
          eq(interestRates.sacco_id, SACCO_ID)
        )
      )
      .returning()
    
    if (!deletedRate) {
      throw new Error("Interest rate not found")
    }
    
    return deletedRate
  } catch (error) {
    console.error("Error deleting interest rate:", error)
    throw error
  }
}

/**
 * Get interest rate statistics
 */
export async function getInterestRateStats() {
  try {
    const [stats] = await db
      .select({
        totalRates: sql<number>`COUNT(*)`,
        activeRates: sql<number>`SUM(CASE WHEN ${interestRates.is_active} THEN 1 ELSE 0 END)`,
        minRate: sql<number>`MIN(CAST(${interestRates.rate} AS DECIMAL))`,
        maxRate: sql<number>`MAX(CAST(${interestRates.rate} AS DECIMAL))`,
        avgRate: sql<number>`AVG(CAST(${interestRates.rate} AS DECIMAL))`,
        minAmount: sql<number>`MIN(${interestRates.min_amount})`,
        maxAmount: sql<number>`MAX(${interestRates.max_amount})`,
      })
      .from(interestRates)
      .where(eq(interestRates.sacco_id, SACCO_ID))
    
    return {
      ...stats,
      minRate: Number(stats?.minRate || 0),
      maxRate: Number(stats?.maxRate || 0),
      avgRate: Number(stats?.avgRate || 0),
      minAmount: stats?.minAmount || 0,
      maxAmount: stats?.maxAmount || 0,
    }
  } catch (error) {
    console.error("Error fetching interest rate stats:", error)
    throw new Error("Failed to fetch interest rate statistics")
  }
}

/**
 * Bulk add multiple interest rates
 */
export async function bulkAddInterestRates(rates: CreateInterestRateInput[]) {
  try {
    const results = []
    for (const rate of rates) {
      try {
        const newRate = await addInterestRate(rate)
        results.push({ success: true, data: newRate })
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to add rate",
          data: rate 
        })
      }
    }
    return results
  } catch (error) {
    console.error("Error bulk adding interest rates:", error)
    throw new Error("Failed to bulk add interest rates")
  }
}

/**
 * Validate interest rate range
 */
export function validateInterestRateRange(
  minAmount: number,
  maxAmount: number,
  rate: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (minAmount <= 0) {
    errors.push("Minimum amount must be greater than 0")
  }
  
  if (maxAmount <= 0) {
    errors.push("Maximum amount must be greater than 0")
  }
  
  if (minAmount >= maxAmount) {
    errors.push("Minimum amount must be less than maximum amount")
  }
  
  if (rate <= 0) {
    errors.push("Interest rate must be greater than 0")
  }
  
  if (rate > 100) {
    errors.push("Interest rate cannot exceed 100%")
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get recommended interest rate based on risk profile
 */
export async function getRecommendedRate(
  amount: number,
  durationMonths: number,
  memberRiskScore?: number
) {
  try {
    const baseRate = await getInterestRateForAmount(amount)
    if (!baseRate) {
      throw new Error("No interest rate found for this amount")
    }
    
    let recommendedRate = Number(baseRate.rate)
    
    // Adjust based on duration
    if (durationMonths > 24) {
      recommendedRate += 1 // Longer loans have higher risk
    } else if (durationMonths < 6) {
      recommendedRate -= 0.5 // Shorter loans have lower risk
    }
    
    // Adjust based on member risk score if provided (1-10, lower is better)
    if (memberRiskScore !== undefined) {
      if (memberRiskScore > 7) {
        recommendedRate += 2 // High risk members pay more
      } else if (memberRiskScore < 3) {
        recommendedRate -= 1 // Low risk members get better rates
      }
    }
    
    // Ensure rate stays within reasonable bounds
    recommendedRate = Math.max(0, Math.min(100, recommendedRate))
    
    return {
      recommendedRate,
      baseRate: Number(baseRate.rate),
      adjustments: {
        duration: durationMonths > 24 ? 1 : durationMonths < 6 ? -0.5 : 0,
        risk: memberRiskScore ? (memberRiskScore > 7 ? 2 : memberRiskScore < 3 ? -1 : 0) : 0,
      },
    }
  } catch (error) {
    console.error("Error getting recommended rate:", error)
    throw new Error("Failed to get recommended interest rate")
  }
}