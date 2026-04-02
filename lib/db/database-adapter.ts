/**
 * Database Adapter
 * Uses Drizzle ORM with PostgreSQL
 */

import { db as postgresDb } from '@/db'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DatabaseAdapter {
  select: (table: any) => any
  insert: (table: any) => any
  update: (table: any) => any
  delete: (table: any) => any
}

// ─── Database Adapter Implementation ─────────────────────────────────────────

class SmartDatabaseAdapter implements DatabaseAdapter {
  select(table: any) {
    return (postgresDb as any).select().from(table)
  }

  insert(table: any) {
    return (postgresDb as any).insert(table)
  }

  update(table: any) {
    return (postgresDb as any).update(table)
  }

  delete(table: any) {
    return (postgresDb as any).delete(table)
  }
}

// ─── Export Database Adapter ─────────────────────────────────────────────────

export const smartDb = new SmartDatabaseAdapter()

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getDatabase() {
  return postgresDb
}

export function isUsingLocalDatabase() {
  return false
}

export function isUsingRemoteDatabase() {
  return true
}
