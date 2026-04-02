/**
 * Constants
 * Central configuration for the SACCO Manager application
 */

// Default SACCO ID - can be overridden via environment variable
// For multi-tenant setup, store the clerk_user_id in the saccos table
export const SACCO_ID = process.env.NEXT_PUBLIC_SACCO_ID || "00000000-0000-0000-0000-000000000001"
export const SACCO_NAME = process.env.NEXT_PUBLIC_SACCO_NAME || "My SACCO"

// Database configuration
export const DATABASE_CONFIG = {
  // Connection pool settings
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || "5000"),
}

// Pagination defaults
export const PAGINATION = {
  defaultPageSize: 10,
  maxPageSize: 100,
}

// Date format constants
export const DATE_FORMATS = {
  short: "MMM dd, yyyy",
  long: "MMMM dd, yyyy",
  time: "HH:mm",
  datetime: "MMM dd, yyyy HH:mm",
}
