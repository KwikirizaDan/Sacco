import { getIronSession, type IronSession } from "iron-session"
import { cookies } from "next/headers"
import { db } from "@/db"
import { saccoUsers, saccos } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export interface SessionData {
  userId: string
  saccoId: string
  role: "admin" | "cashier" | "field_agent"
  fullName: string
  email: string
  isLoggedIn: boolean
}

export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "sacco_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set")
  }
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)
}

export async function getCurrentUser(): Promise<SessionData | null> {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || !session.userId) return null
    return {
      userId: session.userId,
      saccoId: session.saccoId,
      role: session.role,
      fullName: session.fullName,
      email: session.email,
      isLoggedIn: true,
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<SessionData> {
  const user = await getCurrentUser()
  if (!user) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }
  return user!
}

export async function requireRole(
  ...roles: Array<"admin" | "cashier" | "field_agent">
): Promise<SessionData> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    const { redirect } = await import("next/navigation")
    redirect("/dashboard")
  }
  return user
}

export type Permission =
  | "view"
  | "add"
  | "edit"
  | "delete"
  | "manage_users"
  | "manage_settings"
  | "create_field_agents"

const PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    "view",
    "add",
    "edit",
    "delete",
    "manage_users",
    "manage_settings",
    "create_field_agents",
  ],
  cashier: ["view", "add", "create_field_agents"],
  field_agent: ["view", "add"],
}

export function getPermissionsForRole(role: string): Permission[] {
  return PERMISSIONS[role] ?? []
}

export async function getPagePermissions() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canManageUsers: false,
      canManageSettings: false,
      canCreateFieldAgents: false,
      role: null as string | null,
      user: null,
    }
  }
  const perms = PERMISSIONS[user.role] ?? []
  return {
    canView: perms.includes("view"),
    canAdd: perms.includes("add"),
    canEdit: perms.includes("edit"),
    canDelete: perms.includes("delete"),
    canManageUsers: perms.includes("manage_users"),
    canManageSettings: perms.includes("manage_settings"),
    canCreateFieldAgents: perms.includes("create_field_agents"),
    role: user.role,
    user,
  }
}
