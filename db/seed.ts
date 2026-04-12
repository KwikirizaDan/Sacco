/**
 * db/seed.ts
 *
 * Seeds:
 *  1. A SACCO record with a fixed UUID
 *  2. An admin user (you) with email/password — NO Clerk
 *  3. Sample cashier and field agent
 *  4. 25 members + loans, savings, fines, transactions, etc.
 *
 * Run:  npx tsx db/seed.ts
 *
 * After seeding, log in at /auth/login with:
 *   Email:    admin@mysacco.ug
 *   Password: Admin@1234
 */

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as dotenv from "dotenv"
import bcrypt from "bcryptjs"
import {
  saccos,
  saccoUsers,
  members,
  loanCategories,
  interestRates,
  loans,
  loanExtensions,
  loanGuarantors,
  savingsCategories,
  savingsAccounts,
  transactions,
  fineCategories,
  fines,
  documents,
  notifications,
  complaints,
  auditLogs,
} from "./schema"

dotenv.config({ path: ".env.local" })

const SACCO_ID = "00000000-0000-0000-0000-000000000001"

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
const fmtDate = (d: Date) => d.toISOString().split("T")[0]

const ugNames = [
  "Okello John",
  "Auma Grace",
  "Mukasa David",
  "Nakato Sarah",
  "Ochieng Peter",
  "Nabirye Mary",
  "Kato Michael",
  "Nansubuga Jane",
  "Lwanga Robert",
  "Nambi Agnes",
  "Ssempija Charles",
  "Namukwaya Florence",
  "Kizito Joseph",
  "Nakawesi Betty",
  "Mugerwa Henry",
  "Nalubega Ruth",
  "Kakooza James",
  "Namutebi Alice",
  "Ssemanda Patrick",
  "Nabatanzi Irene",
  "Kasozi Edward",
  "Nampewo Diana",
  "Mukibi George",
  "Nalweyiso Christine",
  "Ssekandi Andrew",
]

const villages = [
  "Kampala Central",
  "Kawempe",
  "Rubaga",
  "Nakawa",
  "Makindye",
  "Entebbe",
  "Jinja",
  "Mbale",
  "Mbarara",
  "Gulu",
  "Arua",
  "Fort Portal",
  "Masaka",
  "Lira",
  "Soroti",
]

const purposes = [
  "Business expansion",
  "School fees",
  "Medical expenses",
  "Agricultural investment",
  "Home construction",
  "Vehicle purchase",
  "Inventory purchase",
  "Equipment upgrade",
]

async function seed() {
  console.log("🌱 Seeding database…")
  const client = postgres(process.env.DATABASE_URL!, { ssl: "require" })
  const db = drizzle(client)

  try {
    // ── 1. SACCO ────────────────────────────────────────────────────────────
    await db
      .insert(saccos)
      .values({
        id: SACCO_ID,
        name: "My SACCO",
        code: "MYS",
        primary_color: "#f97316",
        contact_email: "info@mysacco.ug",
        contact_phone: "+256 700 000 000",
        address: "Kampala, Uganda",
        is_active: true,
        onboarding_completed: false, // triggers onboarding after first login
      })
      .onConflictDoNothing()
    console.log("✅ SACCO")

    // ── 2. Staff Users ──────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash("Admin@1234", 12)
    const cashierHash = await bcrypt.hash("Cashier@1234", 12)
    const agentHash = await bcrypt.hash("Agent@1234", 12)

    await db
      .insert(saccoUsers)
      .values([
        {
          sacco_id: SACCO_ID,
          full_name: "System Admin",
          email: "admin@mysacco.ug",
          phone: "+256 700 000 001",
          password_hash: adminHash,
          role: "admin",
          is_active: true,
          must_change_password: false,
          notes: "Default admin — change password after setup",
        },
        {
          sacco_id: SACCO_ID,
          full_name: "Super Admin",
          email: "superadmin@mysacco.ug",
          phone: "+256 700 000 004",
          password_hash: adminHash,
          role: "admin",
          is_active: true,
          must_change_password: true,
          notes: "Additional admin for testing",
        },
        {
          sacco_id: SACCO_ID,
          full_name: "Jane Cashier",
          email: "cashier@mysacco.ug",
          phone: "+256 700 000 002",
          password_hash: cashierHash,
          role: "cashier",
          is_active: true,
          must_change_password: true,
        },
        {
          sacco_id: SACCO_ID,
          full_name: "Bob Field Agent",
          email: "agent@mysacco.ug",
          phone: "+256 700 000 003",
          password_hash: agentHash,
          role: "field_agent",
          is_active: true,
          must_change_password: true,
        },
      ])
      .onConflictDoNothing()
    console.log("✅ Staff users (admin / cashier / field_agent)")

    // ── 3. Clear member data ────────────────────────────────────────────────
    await db.delete(auditLogs)
    await db.delete(documents)
    await db.delete(notifications)
    await db.delete(complaints)
    await db.delete(transactions)
    await db.delete(fines)
    await db.delete(fineCategories)
    await db.delete(loanGuarantors)
    await db.delete(loanExtensions)
    await db.delete(loans)
    await db.delete(interestRates)
    await db.delete(loanCategories)
    await db.delete(savingsAccounts)
    await db.delete(savingsCategories)
    await db.delete(members)

    // ── 4. Members ──────────────────────────────────────────────────────────
    const memberRows: (typeof members.$inferInsert)[] = ugNames.map(
      (name, i) => ({
        sacco_id: SACCO_ID,
        member_code: `SAC${String(i + 1).padStart(4, "0")}`,
        full_name: name,
        email: `${name.split(" ")[0].toLowerCase()}${i}@email.com`,
        phone: `+2567${rand(0, 9)}${rand(1000000, 9999999)}`,
        national_id: `CM${rand(1000000, 9999999)}A`,
        address: `${pick(villages)}, Uganda`,
        next_of_kin: ugNames[(i + 5) % ugNames.length],
        next_of_kin_phone: `+2567${rand(0, 9)}${rand(1000000, 9999999)}`,
        status: pick([
          "active",
          "active",
          "active",
          "active",
          "suspended",
        ]) as any,
        joined_at: randDate(new Date(2020, 0, 1), new Date(2024, 11, 31)),
        created_at: new Date(),
        updated_at: new Date(),
      })
    )
    const insertedMembers = await db
      .insert(members)
      .values(memberRows)
      .returning()
    console.log(`✅ ${insertedMembers.length} members`)

    // ── 5. Loan Categories ──────────────────────────────────────────────────
    const loanCatRows: (typeof loanCategories.$inferInsert)[] = [
      {
        sacco_id: SACCO_ID,
        name: "Emergency Loan",
        min_amount: 5000000,
        max_amount: 50000000,
        interest_rate: "5",
        max_duration_months: 6,
        requires_guarantor: false,
      },
      {
        sacco_id: SACCO_ID,
        name: "Business Loan",
        min_amount: 10000000,
        max_amount: 100000000,
        interest_rate: "4",
        max_duration_months: 12,
        requires_guarantor: true,
      },
      {
        sacco_id: SACCO_ID,
        name: "Education Loan",
        min_amount: 2000000,
        max_amount: 30000000,
        interest_rate: "3",
        max_duration_months: 9,
        requires_guarantor: false,
      },
      {
        sacco_id: SACCO_ID,
        name: "Agricultural Loan",
        min_amount: 5000000,
        max_amount: 80000000,
        interest_rate: "4.5",
        max_duration_months: 12,
        requires_guarantor: true,
      },
      {
        sacco_id: SACCO_ID,
        name: "Asset Loan",
        min_amount: 20000000,
        max_amount: 200000000,
        interest_rate: "6",
        max_duration_months: 24,
        requires_guarantor: true,
      },
    ]
    const insertedLoanCats = await db
      .insert(loanCategories)
      .values(loanCatRows)
      .returning()
    console.log(`✅ ${insertedLoanCats.length} loan categories`)

    // ── 6. Interest Rates ───────────────────────────────────────────────────
    const irRows: (typeof interestRates.$inferInsert)[] = [
      {
        sacco_id: SACCO_ID,
        min_amount: 100000,
        max_amount: 500000,
        rate: "5",
        rate_type: "monthly",
      },
      {
        sacco_id: SACCO_ID,
        min_amount: 500001,
        max_amount: 1000000,
        rate: "4.5",
        rate_type: "monthly",
      },
      {
        sacco_id: SACCO_ID,
        min_amount: 1000001,
        max_amount: 3000000,
        rate: "4",
        rate_type: "monthly",
      },
      {
        sacco_id: SACCO_ID,
        min_amount: 3000001,
        max_amount: 5000000,
        rate: "3.5",
        rate_type: "monthly",
      },
      {
        sacco_id: SACCO_ID,
        min_amount: 5000001,
        max_amount: 10000000,
        rate: "3",
        rate_type: "monthly",
      },
      {
        sacco_id: SACCO_ID,
        min_amount: 10000001,
        max_amount: 50000000,
        rate: "2.5",
        rate_type: "monthly",
      },
    ]
    const insertedIR = await db.insert(interestRates).values(irRows).returning()
    console.log(`✅ ${insertedIR.length} interest rates`)

    // ── 7. Loans ────────────────────────────────────────────────────────────
    const loanStatuses = [
      "pending",
      "approved",
      "disbursed",
      "active",
      "settled",
      "declined",
      "defaulted",
    ] as const
    const loanRows: (typeof loans.$inferInsert)[] = []
    for (let i = 0; i < 30; i++) {
      const m = pick(insertedMembers)
      const cat = pick(insertedLoanCats)
      const ir = pick(insertedIR)
      const amount = rand(500000, 20000000)
      const irVal = parseFloat(ir.rate as string)
      const dur = rand(3, 24)
      const interest = (amount * irVal * dur) / 100
      const expected = amount + interest
      const status = pick(loanStatuses)
      const createdAt = randDate(new Date(2022, 0, 1), new Date(2024, 11, 31))
      const dueDate = new Date(createdAt.getTime() + dur * 30 * 86400000)
      loanRows.push({
        sacco_id: SACCO_ID,
        member_id: m.id,
        category_id: cat.id,
        interest_rate_id: ir.id,
        loan_ref: `LN${new Date().getFullYear()}${String(i + 1).padStart(5, "0")}`,
        amount,
        expected_received: Math.floor(expected),
        balance:
          status === "settled"
            ? 0
            : Math.floor((expected * rand(20, 90)) / 100),
        interest_rate: ir.rate,
        interest_type: "monthly",
        duration_months: dur,
        status,
        daily_payment: Math.ceil(expected / (dur * 30)),
        monthly_payment: Math.ceil(expected / dur),
        due_date: fmtDate(dueDate),
        disbursed_at: ["disbursed", "active", "settled", "defaulted"].includes(
          status
        )
          ? new Date(createdAt.getTime() + rand(1, 7) * 86400000)
          : null,
        settled_at:
          status === "settled"
            ? new Date(dueDate.getTime() - rand(1, 30) * 86400000)
            : null,
        decline_reason:
          status === "declined" ? "Insufficient collateral" : null,
        notes: pick(purposes),
        created_at: createdAt,
        updated_at: new Date(),
      })
    }
    const insertedLoans = await db.insert(loans).values(loanRows).returning()
    console.log(`✅ ${insertedLoans.length} loans`)

    // ── 8. Savings Categories ───────────────────────────────────────────────
    const scRows: (typeof savingsCategories.$inferInsert)[] = [
      {
        sacco_id: SACCO_ID,
        name: "Regular Savings",
        interest_rate: "2",
        is_fixed: false,
        is_active: true,
      },
      {
        sacco_id: SACCO_ID,
        name: "Fixed Deposit",
        interest_rate: "5",
        is_fixed: true,
        is_active: true,
      },
      {
        sacco_id: SACCO_ID,
        name: "Goal Savings",
        interest_rate: "3",
        is_fixed: false,
        is_active: true,
      },
    ]
    const insertedSC = await db
      .insert(savingsCategories)
      .values(scRows)
      .returning()

    // ── 9. Savings Accounts ─────────────────────────────────────────────────
    const saRows: (typeof savingsAccounts.$inferInsert)[] = insertedMembers
      .slice(0, 20)
      .map((m, i) => {
        const cat = pick(insertedSC)
        const isFixed = cat.is_fixed ?? false
        return {
          sacco_id: SACCO_ID,
          member_id: m.id,
          category_id: cat.id,
          account_number: `SAV${String(i + 1).padStart(6, "0")}`,
          balance: rand(100000, 10000000),
          account_type: isFixed ? "fixed" : "regular",
          is_locked: isFixed || Math.random() > 0.8,
          lock_reason: isFixed ? "Fixed deposit" : null,
          created_at: new Date(),
          updated_at: new Date(),
        }
      })
    const insertedSA = await db
      .insert(savingsAccounts)
      .values(saRows)
      .returning()
    console.log(`✅ ${insertedSA.length} savings accounts`)

    // ── 10. Transactions ────────────────────────────────────────────────────
    const txTypes = [
      "loan_disbursement",
      "loan_repayment",
      "savings_deposit",
      "savings_withdrawal",
      "fine_payment",
    ] as const
    const txRows: (typeof transactions.$inferInsert)[] = Array.from(
      { length: 60 },
      () => {
        const m = pick(insertedMembers)
        return {
          sacco_id: SACCO_ID,
          member_id: m.id,
          type: pick(txTypes),
          amount: rand(50000, 2000000),
          balance_after: rand(100000, 10000000),
          payment_method: pick([
            "cash",
            "mobile_money",
            "mtn",
            "airtel",
          ] as const),
          narration: `Transaction for ${m.full_name}`,
          created_at: randDate(new Date(2022, 0, 1), new Date(2024, 11, 31)),
        }
      }
    )
    const insertedTx = await db.insert(transactions).values(txRows).returning()
    console.log(`✅ ${insertedTx.length} transactions`)

    // ── 11. Fine Categories ─────────────────────────────────────────────────
    const fcRows: (typeof fineCategories.$inferInsert)[] = [
      {
        sacco_id: SACCO_ID,
        name: "Late Loan Repayment",
        default_amount: 20000,
      },
      {
        sacco_id: SACCO_ID,
        name: "Absence from Meeting",
        default_amount: 10000,
      },
      { sacco_id: SACCO_ID, name: "Late Contribution", default_amount: 15000 },
      { sacco_id: SACCO_ID, name: "Rule Violation", default_amount: 50000 },
    ]
    const insertedFC = await db
      .insert(fineCategories)
      .values(fcRows)
      .returning()

    // ── 12. Fines ───────────────────────────────────────────────────────────
    const fineRows: (typeof fines.$inferInsert)[] = Array.from(
      { length: 25 },
      (_, i) => {
        const m = pick(insertedMembers)
        const cat = pick(insertedFC)
        const status = pick(["pending", "paid", "waived"] as const)
        const createdAt = randDate(new Date(2022, 0, 1), new Date(2024, 11, 31))
        return {
          sacco_id: SACCO_ID,
          member_id: m.id,
          category_id: cat.id,
          fine_ref: `FN${new Date().getFullYear()}${String(i + 1).padStart(5, "0")}`,
          amount: (cat.default_amount ?? 10000) + rand(0, 10000),
          reason: cat.name,
          status,
          priority: pick(["low", "normal", "high", "urgent"]),
          paid_at: status === "paid" ? new Date() : null,
          payment_method: status === "paid" ? ("cash" as const) : null,
          created_at: createdAt,
          updated_at: new Date(),
        }
      }
    )
    const insertedFines = await db.insert(fines).values(fineRows).returning()
    console.log(`✅ ${insertedFines.length} fines`)

    // ── 13. Documents ───────────────────────────────────────────────────────
    const docTypes = [
      "national_id",
      "registration_form",
      "loan_contract",
      "membership_certificate",
    ] as const
    const docRows: (typeof documents.$inferInsert)[] = Array.from(
      { length: 20 },
      (_, i) => {
        const m = pick(insertedMembers)
        const type = pick(docTypes)
        return {
          sacco_id: SACCO_ID,
          member_id: m.id,
          loan_id: type === "loan_contract" ? pick(insertedLoans).id : null,
          type,
          file_name: `${m.member_code}_${type}_${rand(1000, 9999)}.pdf`,
          blob_url: `https://example.com/docs/${m.member_code}/${type}.pdf`,
          created_at: new Date(),
        }
      }
    )
    const insertedDocs = await db.insert(documents).values(docRows).returning()
    console.log(`✅ ${insertedDocs.length} documents`)

    // ── 14. Notifications ───────────────────────────────────────────────────
    const notifTitles = [
      "Loan Approved",
      "Payment Due",
      "Meeting Reminder",
      "Fine Issued",
      "Savings Deposit",
      "Complaint Update",
    ]
    const notifRows: (typeof notifications.$inferInsert)[] = Array.from(
      { length: 30 },
      () => {
        const m = Math.random() > 0.3 ? pick(insertedMembers) : null
        const status = pick(["pending", "sent", "failed"] as const)
        return {
          sacco_id: SACCO_ID,
          member_id: m?.id ?? null,
          title: pick(notifTitles),
          body: `Notification regarding ${pick(notifTitles).toLowerCase()}.`,
          type: pick(["sms", "in_app"] as const),
          status,
          priority: pick(["low", "normal", "high", "urgent"]),
          channel: pick(["sms", "in_app"]),
          recipient_phone: m?.phone ?? null,
          sent_at: status === "sent" ? new Date() : null,
          created_at: randDate(new Date(2023, 0, 1), new Date(2024, 11, 31)),
          updated_at: new Date(),
        }
      }
    )
    const insertedNotifs = await db
      .insert(notifications)
      .values(notifRows)
      .returning()
    console.log(`✅ ${insertedNotifs.length} notifications`)

    // ── 15. Complaints ──────────────────────────────────────────────────────
    const complaintSubjects = [
      "Loan Processing Delay",
      "Incorrect Balance",
      "Poor Service",
      "System Error",
      "Unauthorized Transaction",
    ]
    const complaintRows: (typeof complaints.$inferInsert)[] = Array.from(
      { length: 20 },
      (_, i) => {
        const m = pick(insertedMembers)
        const status = pick(["open", "in_progress", "resolved"] as const)
        const createdAt = randDate(new Date(2023, 0, 1), new Date(2024, 11, 31))
        return {
          sacco_id: SACCO_ID,
          member_id: m.id,
          complaint_ref: `CMP${new Date().getFullYear()}${String(i + 1).padStart(5, "0")}`,
          subject: pick(complaintSubjects),
          body: "Complaint details here.",
          category: pick(["general", "loan", "savings", "service"] as const),
          priority: pick(["low", "normal", "high", "urgent"]),
          status,
          resolution_notes:
            status === "resolved"
              ? "Issue resolved and member notified."
              : null,
          resolved_at: status === "resolved" ? new Date() : null,
          satisfaction_rating: status === "resolved" ? rand(3, 5) : null,
          created_at: createdAt,
          updated_at: new Date(),
        }
      }
    )
    const insertedComplaints = await db
      .insert(complaints)
      .values(complaintRows)
      .returning()
    console.log(`✅ ${insertedComplaints.length} complaints`)

    // ── 16. Audit Logs ──────────────────────────────────────────────────────
    const auditRows: (typeof auditLogs.$inferInsert)[] = Array.from(
      { length: 40 },
      () => ({
        sacco_id: SACCO_ID,
        actor_name: pick(["System Admin", "Jane Cashier", "Bob Field Agent"]),
        actor_role: pick(["admin", "cashier", "field_agent"]),
        action: pick(["created", "updated", "deleted", "approved", "rejected"]),
        entity: pick([
          "member",
          "loan",
          "savings_account",
          "fine",
          "transaction",
        ]),
        entity_id: pick(insertedMembers).id,
        diff: JSON.stringify({ before: {}, after: {} }),
        created_at: randDate(new Date(2023, 0, 1), new Date(2024, 11, 31)),
      })
    )
    const insertedAudit = await db
      .insert(auditLogs)
      .values(auditRows)
      .returning()
    console.log(`✅ ${insertedAudit.length} audit logs`)

    console.log(`
🎉 Seeding complete!

┌─────────────────────────────────────────┐
│           LOGIN CREDENTIALS             │
│                                         │
│  Admin:                                 │
│    Email:    admin@mysacco.ug           │
│    Password: Admin@1234                 │
│                                         │
│  Super Admin:                           │
│    Email:    superadmin@mysacco.ug      │
│    Password: Admin@1234                 │
│                                         │
│  Cashier:                               │
│    Email:    cashier@mysacco.ug         │
│    Password: Cashier@1234               │
│                                         │
│  Field Agent:                           │
│    Email:    agent@mysacco.ug           │
│    Password: Agent@1234                 │
│                                         │
│  URL: http://localhost:3000/auth/login  │
└─────────────────────────────────────────┘
    `)
  } catch (err) {
    console.error("❌ Seed failed:", err)
    throw err
  } finally {
    await client.end()
  }
}

seed()
