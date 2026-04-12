"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { saccoUsers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

export type UserFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const createSchema = z.object({
  full_name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "cashier", "field_agent"]),
  notes: z.string().optional(),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createUserAction(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }

  const roleToCreate = formData.get("role") as string

  if (actor.role === "cashier" && roleToCreate !== "field_agent") {
    return { error: "Cashiers can only create Field Agents." }
  }
  if (actor.role === "field_agent") {
    return { error: "Field Agents cannot create users." }
  }

  const raw = {
    full_name: formData.get("full_name") as string,
    email: ((formData.get("email") as string) ?? "").trim().toLowerCase(),
    password: formData.get("password") as string,
    phone: (formData.get("phone") as string) || undefined,
    role: roleToCreate,
    notes: (formData.get("notes") as string) || undefined,
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  // Check duplicate
  const existing = await db
    .select({ id: saccoUsers.id })
    .from(saccoUsers)
    .where(
      and(
        eq(saccoUsers.sacco_id, actor.saccoId),
        eq(saccoUsers.email, parsed.data.email)
      )
    )
    .limit(1)

  if (existing.length > 0)
    return { error: "A user with this email already exists." }

  const password_hash = await bcrypt.hash(parsed.data.password, 12)

  await db.insert(saccoUsers).values({
    sacco_id: actor.saccoId,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    password_hash,
    role: parsed.data.role as "admin" | "cashier" | "field_agent",
    notes: parsed.data.notes ?? null,
    is_active: true,
    must_change_password: true,
    created_by: actor.userId as any,
  })

  revalidatePath("/dashboard/users")
  return { success: true }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUserAction(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }
  if (actor.role !== "admin") return { error: "Only admins can edit users." }

  const id = formData.get("id") as string
  const role = formData.get("role") as "admin" | "cashier" | "field_agent"

  await db
    .update(saccoUsers)
    .set({
      full_name: formData.get("full_name") as string,
      phone: (formData.get("phone") as string) || null,
      role,
      notes: (formData.get("notes") as string) || null,
      updated_at: new Date(),
    })
    .where(and(eq(saccoUsers.id, id), eq(saccoUsers.sacco_id, actor.saccoId)))

  revalidatePath("/dashboard/users")
  return { success: true }
}

// ─── Toggle Active ────────────────────────────────────────────────────────────

export async function toggleUserActiveAction(
  id: string,
  isActive: boolean
): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }
  if (actor.role !== "admin") return { error: "Only admins can do this." }
  if (id === actor.userId) return { error: "You cannot deactivate yourself." }

  await db
    .update(saccoUsers)
    .set({ is_active: isActive, updated_at: new Date() })
    .where(and(eq(saccoUsers.id, id), eq(saccoUsers.sacco_id, actor.saccoId)))

  revalidatePath("/dashboard/users")
  return { success: true }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(
  id: string,
  newPassword: string
): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }
  if (actor.role !== "admin")
    return { error: "Only admins can reset passwords." }
  if (newPassword.length < 8)
    return { error: "Password must be at least 8 characters." }

  const password_hash = await bcrypt.hash(newPassword, 12)

  await db
    .update(saccoUsers)
    .set({ password_hash, must_change_password: true, updated_at: new Date() })
    .where(and(eq(saccoUsers.id, id), eq(saccoUsers.sacco_id, actor.saccoId)))

  revalidatePath("/dashboard/users")
  return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteUserAction(id: string): Promise<UserFormState> {
  const actor = await getCurrentUser()
  if (!actor) return { error: "Not authenticated." }
  if (actor.role !== "admin") return { error: "Only admins can delete users." }
  if (id === actor.userId)
    return { error: "You cannot delete your own account." }

  await db
    .delete(saccoUsers)
    .where(and(eq(saccoUsers.id, id), eq(saccoUsers.sacco_id, actor.saccoId)))

  revalidatePath("/dashboard/users")
  return { success: true }
}
