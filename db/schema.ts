import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "suspended",
  "exited",
])
export const loanStatusEnum = pgEnum("loan_status", [
  "pending",
  "verified",
  "approved",
  "declined",
  "disbursed",
  "active",
  "extended",
  "settled",
  "defaulted",
])
export const savingsAccountTypeEnum = pgEnum("savings_account_type", [
  "regular",
  "fixed",
])
export const fineStatusEnum = pgEnum("fine_status", [
  "pending",
  "paid",
  "waived",
])
export const transactionTypeEnum = pgEnum("transaction_type", [
  "loan_disbursement",
  "loan_repayment",
  "savings_deposit",
  "savings_withdrawal",
  "fine_payment",
])
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "mobile_money",
  "bank",
  "flutterwave",
  "mtn",
  "airtel",
])
export const documentTypeEnum = pgEnum("document_type", [
  "national_id",
  "registration_form",
  "loan_contract",
  "membership_certificate",
  "other",
])
export const notificationTypeEnum = pgEnum("notification_type", [
  "sms",
  "in_app",
])
export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
])
export const complaintStatusEnum = pgEnum("complaint_status", [
  "open",
  "in_progress",
  "resolved",
])
export const interestTypeEnum = pgEnum("interest_type", [
  "daily",
  "monthly",
  "annual",
])
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "cashier",
  "field_agent",
])

export const saccos = pgTable("saccos", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").unique(),
  logo_url: text("logo_url"),
  primary_color: text("primary_color").default("#f97316"),
  contact_email: text("contact_email"),
  contact_phone: text("contact_phone"),
  address: text("address"),
  website: text("website"),
  registration_number: text("registration_number"),
  settings: text("settings").default("{}"),
  is_active: boolean("is_active").default(true),
  onboarding_completed: boolean("onboarding_completed").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const saccoUsers = pgTable("sacco_users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id").references(() => saccos.id),
  full_name: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password_hash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("field_agent"),
  avatar_url: text("avatar_url"),
  is_active: boolean("is_active").default(true),
  must_change_password: boolean("must_change_password").default(false),
  last_login_at: timestamp("last_login_at"),
  notes: text("notes"),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const members = pgTable("members", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  member_code: text("member_code").unique().notNull(),
  full_name: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  national_id: text("national_id"),
  photo_url: text("photo_url"),
  date_of_birth: date("date_of_birth"),
  address: text("address"),
  next_of_kin: text("next_of_kin"),
  next_of_kin_phone: text("next_of_kin_phone"),
  status: memberStatusEnum("status").notNull().default("active"),
  joined_at: timestamp("joined_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const loanCategories = pgTable("loan_categories", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  min_amount: integer("min_amount").default(0),
  max_amount: integer("max_amount").notNull(),
  interest_rate: numeric("interest_rate").notNull().default("0"),
  max_duration_months: integer("max_duration_months").default(12),
  requires_guarantor: boolean("requires_guarantor").default(false),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
})

export const interestRates = pgTable("interest_rates", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  min_amount: integer("min_amount").notNull(),
  max_amount: integer("max_amount").notNull(),
  rate: numeric("rate").notNull(),
  rate_type: interestTypeEnum("rate_type").default("monthly"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const loans = pgTable("loans", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  member_id: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  category_id: uuid("category_id").references(() => loanCategories.id),
  interest_rate_id: uuid("interest_rate_id").references(() => interestRates.id),
  loan_ref: text("loan_ref").unique().notNull(),
  amount: integer("amount").notNull(),
  expected_received: integer("expected_received").notNull(),
  balance: integer("balance").notNull(),
  interest_rate: numeric("interest_rate").notNull(),
  interest_type: interestTypeEnum("interest_type").default("monthly"),
  duration_months: integer("duration_months").default(12),
  status: loanStatusEnum("status").notNull().default("pending"),
  late_penalty_fee: integer("late_penalty_fee").default(0),
  daily_payment: integer("daily_payment").default(0),
  monthly_payment: integer("monthly_payment").default(0),
  due_date: date("due_date"),
  disbursed_at: timestamp("disbursed_at"),
  settled_at: timestamp("settled_at"),
  decline_reason: text("decline_reason"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const loanExtensions = pgTable("loan_extensions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  loan_id: uuid("loan_id")
    .references(() => loans.id)
    .notNull(),
  old_due_date: date("old_due_date").notNull(),
  new_due_date: date("new_due_date").notNull(),
  reason: text("reason"),
  created_at: timestamp("created_at").defaultNow(),
})

export const loanGuarantors = pgTable("loan_guarantors", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  loan_id: uuid("loan_id")
    .references(() => loans.id)
    .notNull(),
  member_id: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow(),
})

export const loanTopUps = pgTable("loan_top_ups", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  loan_id: uuid("loan_id")
    .references(() => loans.id)
    .notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  payment_method: paymentMethodEnum("payment_method").default("cash"),
  notes: text("notes"),
  processed_by: uuid("processed_by"),
  created_at: timestamp("created_at").defaultNow(),
})

export const savingsCategories = pgTable("savings_categories", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  interest_rate: numeric("interest_rate").default("0"),
  is_fixed: boolean("is_fixed").default(false),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
})

export const savingsAccounts = pgTable("savings_accounts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  member_id: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  category_id: uuid("category_id").references(() => savingsCategories.id),
  account_number: text("account_number").unique().notNull(),
  balance: integer("balance").notNull().default(0),
  account_type: savingsAccountTypeEnum("account_type").default("regular"),
  is_locked: boolean("is_locked").default(false),
  lock_until: date("lock_until"),
  lock_reason: text("lock_reason"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const transactions = pgTable("transactions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  member_id: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  balance_after: integer("balance_after"),
  reference_id: text("reference_id"),
  payment_method: paymentMethodEnum("payment_method").default("cash"),
  narration: text("narration"),
  created_at: timestamp("created_at").defaultNow(),
})

export const fineCategories = pgTable("fine_categories", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  name: text("name").notNull(),
  default_amount: integer("default_amount").default(0),
  created_at: timestamp("created_at").defaultNow(),
})

export const fines = pgTable("fines", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  member_id: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  category_id: uuid("category_id").references(() => fineCategories.id),
  fine_ref: text("fine_ref").unique(),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  description: text("description"),
  status: fineStatusEnum("status").notNull().default("pending"),
  priority: text("priority").default("normal"),
  due_date: date("due_date"),
  paid_at: timestamp("paid_at"),
  payment_method: paymentMethodEnum("payment_method"),
  payment_reference: text("payment_reference"),
  waived_by: uuid("waived_by"),
  waiver_reason: text("waiver_reason"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const documents = pgTable("documents", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  member_id: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  loan_id: uuid("loan_id").references(() => loans.id),
  type: documentTypeEnum("type").notNull(),
  file_name: text("file_name").notNull(),
  blob_url: text("blob_url").notNull(),
  created_at: timestamp("created_at").defaultNow(),
})

export const notifications = pgTable("notifications", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  member_id: uuid("member_id").references(() => members.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: notificationTypeEnum("type").default("sms"),
  status: notificationStatusEnum("status").default("pending"),
  priority: text("priority").default("normal"),
  channel: text("channel").default("sms"),
  recipient_phone: text("recipient_phone"),
  recipient_email: text("recipient_email"),
  reference_type: text("reference_type"),
  reference_id: text("reference_id"),
  metadata: text("metadata").default("{}"),
  retry_count: integer("retry_count").default(0),
  max_retries: integer("max_retries").default(3),
  error_message: text("error_message"),
  scheduled_at: timestamp("scheduled_at"),
  sent_at: timestamp("sent_at"),
  delivered_at: timestamp("delivered_at"),
  read_at: timestamp("read_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const complaints = pgTable("complaints", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  member_id: uuid("member_id").references(() => members.id),
  complaint_ref: text("complaint_ref").unique(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: text("category").default("general"),
  priority: text("priority").default("normal"),
  status: complaintStatusEnum("status").default("open"),
  assigned_to: uuid("assigned_to"),
  resolution_notes: text("resolution_notes"),
  resolved_at: timestamp("resolved_at"),
  resolved_by: uuid("resolved_by"),
  satisfaction_rating: integer("satisfaction_rating"),
  feedback: text("feedback"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sacco_id: uuid("sacco_id")
    .references(() => saccos.id)
    .notNull(),
  actor_id: uuid("actor_id"),
  actor_name: text("actor_name"),
  actor_role: text("actor_role"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entity_id: uuid("entity_id"),
  diff: text("diff"),
  ip_address: text("ip_address"),
  created_at: timestamp("created_at").defaultNow(),
})

export type Sacco = typeof saccos.$inferSelect
export type SaccoUser = typeof saccoUsers.$inferSelect
export type Member = typeof members.$inferSelect
export type Loan = typeof loans.$inferSelect
export type LoanCategory = typeof loanCategories.$inferSelect
export type InterestRate = typeof interestRates.$inferSelect
export type LoanExtension = typeof loanExtensions.$inferSelect
export type LoanGuarantor = typeof loanGuarantors.$inferInsert
export type LoanTopUp = typeof loanTopUps.$inferSelect
export type SavingsAccount = typeof savingsAccounts.$inferSelect
export type SavingsCategory = typeof savingsCategories.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Fine = typeof fines.$inferSelect
export type FineCategory = typeof fineCategories.$inferSelect
export type Document = typeof documents.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type Complaint = typeof complaints.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
