import { redirect } from "next/navigation"
import { getPagePermissions } from "@/lib/auth"
import { db } from "@/db"
import { saccoUsers } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { UsersClient } from "./components/users-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Users — SACCO Manager" }

export default async function UsersPage() {
  const { role, user, canManageUsers } = await getPagePermissions()

  // Field agents have no access
  if (role === "field_agent" || !user) redirect("/dashboard")

  const allUsers = await db
    .select({
      id: saccoUsers.id,
      sacco_id: saccoUsers.sacco_id,
      full_name: saccoUsers.full_name,
      email: saccoUsers.email,
      phone: saccoUsers.phone,
      role: saccoUsers.role,
      is_active: saccoUsers.is_active,
      must_change_password: saccoUsers.must_change_password,
      last_login_at: saccoUsers.last_login_at,
      notes: saccoUsers.notes,
      created_by: saccoUsers.created_by,
      created_at: saccoUsers.created_at,
      updated_at: saccoUsers.updated_at,
    })
    .from(saccoUsers)
    .where(eq(saccoUsers.sacco_id, user.saccoId))
    .orderBy(desc(saccoUsers.created_at))

  return (
    <UsersClient
      users={allUsers}
      currentUser={user}
      canManageUsers={canManageUsers}
    />
  )
}
