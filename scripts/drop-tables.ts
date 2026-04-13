import { sql } from "drizzle-orm"
import { db } from "../db"

async function dropTables() {
  console.log("Dropping all tables...")

  // Drop tables in reverse order of dependencies
  await db.execute(sql`DROP TABLE IF EXISTS audit_logs CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS complaints CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS documents CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS fines CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS fine_categories CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS loan_top_ups CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS loan_extensions CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS loan_guarantors CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS loans CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS interest_rates CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS loan_categories CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS transactions CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS savings_accounts CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS savings_categories CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS members CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS notifications CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS sacco_users CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS saccos CASCADE`)

  // Also drop the enum types if needed
  await db.execute(sql`DROP TYPE IF EXISTS user_role CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS member_status CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS loan_status CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS savings_account_type CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS fine_status CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS transaction_type CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS payment_method CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS document_type CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS notification_type CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS notification_status CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS complaint_status CASCADE`)
  await db.execute(sql`DROP TYPE IF EXISTS interest_type CASCADE`)

  console.log("All tables and types dropped")
}

dropTables().catch(console.error)
