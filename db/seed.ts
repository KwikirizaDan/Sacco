import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as dotenv from "dotenv"
import {
  saccos,
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

// Helper functions
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const randomChoice = <T>(arr: readonly T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)]
}

const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0]
}

const ugandanNames = [
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

const ugandanVillages = [
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
  "Hoima",
  "Kabale",
  "Tororo",
  "Masindi",
  "Kitgum",
]

const loanPurposes = [
  "Business expansion",
  "School fees",
  "Medical expenses",
  "Agricultural investment",
  "Home construction",
  "Vehicle purchase",
  "Inventory purchase",
  "Equipment upgrade",
  "Land purchase",
  "Family emergency",
]

async function seed() {
  console.log("🌱 Starting database seeding...")

  const client = postgres(process.env.DATABASE_URL!, { ssl: "require" })
  const db = drizzle(client)

  try {
    // Clear existing data (keep sacco)
    console.log("Clearing existing data...")
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

    console.log("Seeding members...")
    const memberData: typeof members.$inferInsert[] = []
    for (let i = 0; i < 25; i++) {
      const firstName = ugandanNames[i % ugandanNames.length].split(" ")[0]
      const lastName = ugandanNames[Math.floor(Math.random() * ugandanNames.length)].split(" ")[1]
      const fullName = `${firstName} ${lastName}`
      const joinedDate = randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31))
      
      memberData.push({
        sacco_id: SACCO_ID,
        member_code: `SAC${String(i + 1).padStart(4, "0")}`,
        full_name: fullName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        phone: `+2567${randomInt(0, 9)}${randomInt(1000000, 9999999)}`,
        national_id: `CM${randomInt(1000000, 9999999)}${String.fromCharCode(65 + randomInt(0, 25))}`,
        address: `${randomChoice(ugandanVillages)}, Uganda`,
        next_of_kin: ugandanNames[(i + 5) % ugandanNames.length],
        next_of_kin_phone: `+2567${randomInt(0, 9)}${randomInt(1000000, 9999999)}`,
        status: randomChoice(["active", "active", "active", "active", "suspended"]) as "active" | "suspended" | "exited",
        joined_at: joinedDate,
        created_at: joinedDate,
        updated_at: new Date(),
      })
    }
    const insertedMembers = await db.insert(members).values(memberData).returning()
    console.log(`✅ Inserted ${insertedMembers.length} members`)

    console.log("Seeding loan categories...")
    const loanCategoryData: typeof loanCategories.$inferInsert[] = [
      { sacco_id: SACCO_ID, name: "Emergency Loan", description: "Quick loan for emergencies", min_amount: 5000000, max_amount: 50000000, interest_rate: "5", max_duration_months: 6, requires_guarantor: false },
      { sacco_id: SACCO_ID, name: "Business Loan", description: "For business expansion", min_amount: 10000000, max_amount: 100000000, interest_rate: "4", max_duration_months: 12, requires_guarantor: true },
      { sacco_id: SACCO_ID, name: "Education Loan", description: "School fees and education", min_amount: 2000000, max_amount: 30000000, interest_rate: "3", max_duration_months: 9, requires_guarantor: false },
      { sacco_id: SACCO_ID, name: "Agricultural Loan", description: "Farm inputs and equipment", min_amount: 5000000, max_amount: 80000000, interest_rate: "4.5", max_duration_months: 12, requires_guarantor: true },
      { sacco_id: SACCO_ID, name: "Asset Loan", description: "Purchase of vehicles, land", min_amount: 20000000, max_amount: 200000000, interest_rate: "6", max_duration_months: 24, requires_guarantor: true },
    ]
    const insertedCategories = await db.insert(loanCategories).values(loanCategoryData).returning()
    console.log(`✅ Inserted ${insertedCategories.length} loan categories`)

    console.log("Seeding interest rates...")
    const interestRateData: typeof interestRates.$inferInsert[] = [
      { sacco_id: SACCO_ID, min_amount: 100000, max_amount: 500000, rate: "5", rate_type: "monthly" },
      { sacco_id: SACCO_ID, min_amount: 500001, max_amount: 1000000, rate: "4.5", rate_type: "monthly" },
      { sacco_id: SACCO_ID, min_amount: 1000001, max_amount: 3000000, rate: "4", rate_type: "monthly" },
      { sacco_id: SACCO_ID, min_amount: 3000001, max_amount: 5000000, rate: "3.5", rate_type: "monthly" },
      { sacco_id: SACCO_ID, min_amount: 5000001, max_amount: 10000000, rate: "3", rate_type: "monthly" },
      { sacco_id: SACCO_ID, min_amount: 10000001, max_amount: 50000000, rate: "2.5", rate_type: "monthly" },
      { sacco_id: SACCO_ID, min_amount: 50000001, max_amount: 100000000, rate: "2", rate_type: "monthly" },
      { sacco_id: SACCO_ID, min_amount: 100000001, max_amount: 500000000, rate: "1.5", rate_type: "monthly" },
    ]
    const insertedInterestRates = await db.insert(interestRates).values(interestRateData).returning()
    console.log(`✅ Inserted ${insertedInterestRates.length} interest rates`)

    console.log("Seeding loans...")
    const loanStatuses = ["pending", "approved", "disbursed", "active", "settled", "declined", "defaulted"] as const
    const loanData: typeof loans.$inferInsert[] = []
    
    for (let i = 0; i < 30; i++) {
      const member = randomChoice(insertedMembers)
      const category = randomChoice(insertedCategories)
      const amount = randomInt(category.min_amount || 1000000, category.max_amount || 10000000)
      const duration = randomInt(3, category.max_duration_months || 12)
      const interestRate = category.interest_rate || "5"
      const rateValue = parseFloat(interestRate)
      const totalInterest = Math.round(amount * (rateValue / 100) * duration)
      const expectedReceived = amount + totalInterest
      const status = randomChoice(loanStatuses)
      
      let balance = status === "settled" ? 0 : status === "active" ? randomInt(0, expectedReceived) : expectedReceived
      let disbursedAt = null as Date | null
      let settledAt = null as Date | null
      let dueDate = null as string | null
      
      const createdAt = randomDate(new Date(2023, 0, 1), new Date(2024, 10, 30))
      
      if (status !== "pending" && status !== "approved" && status !== "declined") {
        disbursedAt = new Date(createdAt.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000)
        dueDate = formatDate(new Date(disbursedAt.getTime() + duration * 30 * 24 * 60 * 60 * 1000))
      }
      
      if (status === "settled") {
        settledAt = new Date(new Date(dueDate!).getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000)
        balance = 0
      }
      
      loanData.push({
        sacco_id: SACCO_ID,
        member_id: member.id,
        category_id: category.id,
        interest_rate_id: randomChoice(insertedInterestRates).id,
        loan_ref: `LN${new Date().getFullYear()}${String(i + 1).padStart(5, "0")}`,
        amount: amount,
        expected_received: expectedReceived,
        balance: balance,
        interest_rate: interestRate,
        interest_type: "monthly",
        duration_months: duration,
        status: status,
        late_penalty_fee: 50000,
        daily_payment: Math.round(expectedReceived / (duration * 30)),
        monthly_payment: Math.round(expectedReceived / duration),
        due_date: dueDate,
        disbursed_at: disbursedAt,
        settled_at: settledAt,
        decline_reason: status === "declined" ? "Insufficient collateral" : null,
        notes: randomChoice(loanPurposes),
        created_at: createdAt,
        updated_at: new Date(),
      })
    }
    const insertedLoans = await db.insert(loans).values(loanData).returning()
    console.log(`✅ Inserted ${insertedLoans.length} loans`)

    console.log("Seeding savings categories...")
    const savingsCategoryData: typeof savingsCategories.$inferInsert[] = [
      { sacco_id: SACCO_ID, name: "Regular Savings", description: "Standard savings account", interest_rate: "3", is_fixed: false },
      { sacco_id: SACCO_ID, name: "Fixed Deposit", description: "Fixed term savings", interest_rate: "8", is_fixed: true },
      { sacco_id: SACCO_ID, name: "Education Fund", description: "For school fees", interest_rate: "4", is_fixed: false },
      { sacco_id: SACCO_ID, name: "Retirement Fund", description: "Long term savings", interest_rate: "6", is_fixed: false },
    ]
    const insertedSavingsCategories = await db.insert(savingsCategories).values(savingsCategoryData).returning()
    console.log(`✅ Inserted ${insertedSavingsCategories.length} savings categories`)

    console.log("Seeding savings accounts...")
    const savingsAccountData: typeof savingsAccounts.$inferInsert[] = []
    for (let i = 0; i < 25; i++) {
      const member = insertedMembers[i % insertedMembers.length]
      const category = randomChoice(insertedSavingsCategories)
      
      savingsAccountData.push({
        sacco_id: SACCO_ID,
        member_id: member.id,
        category_id: category.id,
        account_number: `SA${String(i + 1).padStart(6, "0")}`,
        balance: randomInt(0, 50000000),
        account_type: category.is_fixed ? "fixed" : "regular",
        is_locked: category.is_fixed || false,
        created_at: randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31)),
        updated_at: new Date(),
      })
    }
    const insertedSavings = await db.insert(savingsAccounts).values(savingsAccountData).returning()
    console.log(`✅ Inserted ${insertedSavings.length} savings accounts`)

    console.log("Seeding transactions...")
    const transactionTypes = ["loan_disbursement", "loan_repayment", "savings_deposit", "savings_withdrawal", "fine_payment"] as const
    const paymentMethods = ["cash", "mobile_money", "bank"] as const
    const transactionData: typeof transactions.$inferInsert[] = []
    
    for (let i = 0; i < 50; i++) {
      const type = randomChoice(transactionTypes)
      const member = randomChoice(insertedMembers)
      const amount = randomInt(100000, 5000000)
      
      transactionData.push({
        sacco_id: SACCO_ID,
        member_id: member.id,
        type: type,
        amount: amount,
        balance_after: randomInt(0, 10000000),
        reference_id: type === "loan_disbursement" || type === "loan_repayment" ? randomChoice(insertedLoans).id : null,
        payment_method: randomChoice(paymentMethods),
        narration: `${type.replace("_", " ")} transaction`,
        created_at: randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31)),
      })
    }
    const insertedTransactions = await db.insert(transactions).values(transactionData).returning()
    console.log(`✅ Inserted ${insertedTransactions.length} transactions`)

    console.log("Seeding fine categories...")
    const fineCategoryData: typeof fineCategories.$inferInsert[] = [
      { sacco_id: SACCO_ID, name: "Late Meeting", default_amount: 10000 },
      { sacco_id: SACCO_ID, name: "Missed Contribution", default_amount: 50000 },
      { sacco_id: SACCO_ID, name: "Late Loan Repayment", default_amount: 25000 },
      { sacco_id: SACCO_ID, name: "Improper Documentation", default_amount: 15000 },
      { sacco_id: SACCO_ID, name: "Disrespectful Conduct", default_amount: 20000 },
    ]
    const insertedFineCategories = await db.insert(fineCategories).values(fineCategoryData).returning()
    console.log(`✅ Inserted ${insertedFineCategories.length} fine categories`)

    console.log("Seeding fines...")
    const fineStatuses = ["pending", "paid", "waived"] as const
    const finePriorities = ["low", "normal", "high"] as const
    const finePaymentMethods = ["cash", "mobile_money", "bank"] as const
    const fineData: typeof fines.$inferInsert[] = []
    
    for (let i = 0; i < 25; i++) {
      const category = randomChoice(insertedFineCategories)
      const status = randomChoice(fineStatuses)
      const member = randomChoice(insertedMembers)
      const createdAt = randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31))
      const amount = (category.default_amount || 10000) + randomInt(-5000, 5000)
      
      fineData.push({
        sacco_id: SACCO_ID,
        member_id: member.id,
        category_id: category.id,
        fine_ref: `FN${new Date().getFullYear()}${String(i + 1).padStart(5, "0")}`,
        amount: amount,
        reason: `Fine for ${category.name.toLowerCase()}`,
        description: `This fine was issued for ${category.name.toLowerCase()}. Please pay by the due date to avoid additional penalties.`,
        status: status,
        priority: randomChoice(finePriorities),
        due_date: formatDate(new Date(createdAt.getTime() + randomInt(7, 30) * 24 * 60 * 60 * 1000)),
        paid_at: status === "paid" ? randomDate(new Date(createdAt.getTime() + 24 * 60 * 60 * 1000), new Date(2024, 11, 31)) : null,
        payment_method: status === "paid" ? randomChoice(finePaymentMethods) : null,
        payment_reference: status === "paid" ? `PAY${randomInt(100000, 999999)}` : null,
        waived_by: status === "waived" ? null : null, // Would be admin user ID in real scenario
        waiver_reason: status === "waived" ? "Member appeal approved" : null,
        notes: Math.random() > 0.5 ? "Member has been notified" : null,
        created_at: createdAt,
        updated_at: new Date(),
      })
    }
    const insertedFines = await db.insert(fines).values(fineData).returning()
    console.log(`✅ Inserted ${insertedFines.length} fines`)

    console.log("Seeding documents...")
    const documentTypes = ["national_id", "registration_form", "loan_contract", "membership_certificate", "other"] as const
    const documentData: typeof documents.$inferInsert[] = []
    
    for (let i = 0; i < 20; i++) {
      documentData.push({
        sacco_id: SACCO_ID,
        member_id: randomChoice(insertedMembers).id,
        loan_id: Math.random() > 0.5 ? randomChoice(insertedLoans).id : null,
        type: randomChoice(documentTypes),
        file_name: `document_${i + 1}.pdf`,
        blob_url: `https://example.com/documents/doc_${i + 1}.pdf`,
        created_at: randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31)),
      })
    }
    const insertedDocuments = await db.insert(documents).values(documentData).returning()
    console.log(`✅ Inserted ${insertedDocuments.length} documents`)

    console.log("Seeding notifications...")
    const notificationStatuses = ["pending", "sent", "failed"] as const
    const notificationTypes = ["sms", "in_app"] as const
    const notificationPriorities = ["low", "normal", "high", "urgent"] as const
    const notificationChannels = ["sms", "email", "push", "in_app"] as const
    const notificationTitles = [
      "Loan Approved",
      "Payment Due",
      "Meeting Reminder",
      "Contribution Received",
      "Account Updated",
      "Fine Issued",
      "Complaint Update",
      "Savings Deposit",
      "Loan Disbursed",
      "Payment Reminder",
    ]
    const referenceTypes = ["loan", "fine", "complaint", "meeting", "savings", "general"] as const
    const notificationData: typeof notifications.$inferInsert[] = []
    
    for (let i = 0; i < 30; i++) {
      const status = randomChoice(notificationStatuses)
      const member = Math.random() > 0.3 ? randomChoice(insertedMembers) : null
      const createdAt = randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31))
      
      notificationData.push({
        sacco_id: SACCO_ID,
        member_id: member?.id || null,
        title: randomChoice(notificationTitles),
        body: `This is a sample notification message for ${randomChoice(notificationTitles).toLowerCase()}. Please take necessary action.`,
        type: randomChoice(notificationTypes),
        status: status,
        priority: randomChoice(notificationPriorities),
        channel: randomChoice(notificationChannels),
        recipient_phone: member?.phone || null,
        recipient_email: member?.email || null,
        reference_type: randomChoice(referenceTypes),
        reference_id: Math.random() > 0.5 ? randomChoice(insertedLoans).id : null,
        metadata: JSON.stringify({ template_id: `tmpl_${randomInt(1, 10)}`, language: "en" }),
        retry_count: status === "failed" ? randomInt(1, 3) : 0,
        max_retries: 3,
        error_message: status === "failed" ? "Network timeout" : null,
        scheduled_at: new Date(createdAt.getTime() + randomInt(0, 24) * 60 * 60 * 1000),
        sent_at: status === "sent" ? new Date(createdAt.getTime() + randomInt(1, 60) * 60 * 1000) : null,
        delivered_at: status === "sent" ? new Date(createdAt.getTime() + randomInt(2, 120) * 60 * 1000) : null,
        read_at: status === "sent" && Math.random() > 0.5 ? new Date(createdAt.getTime() + randomInt(5, 1440) * 60 * 1000) : null,
        created_at: createdAt,
        updated_at: new Date(),
      })
    }
    const insertedNotifications = await db.insert(notifications).values(notificationData).returning()
    console.log(`✅ Inserted ${insertedNotifications.length} notifications`)

    console.log("Seeding complaints...")
    const complaintStatuses = ["open", "in_progress", "resolved"] as const
    const complaintCategories = ["general", "loan", "savings", "service", "technical", "other"] as const
    const complaintPriorities = ["low", "normal", "high", "urgent"] as const
    const complaintSubjects = [
      "Loan Processing Delay",
      "Incorrect Balance",
      "Poor Customer Service",
      "System Error",
      "Request for Statement",
      "Unauthorized Transaction",
      "Account Access Issue",
      "Payment Not Reflected",
      "Interest Rate Discrepancy",
      "Mobile App Problem",
    ]
    const complaintData: typeof complaints.$inferInsert[] = []
    
    for (let i = 0; i < 20; i++) {
      const status = randomChoice(complaintStatuses)
      const member = randomChoice(insertedMembers)
      const createdAt = randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31))
      const subject = randomChoice(complaintSubjects)
      
      complaintData.push({
        sacco_id: SACCO_ID,
        member_id: member.id,
        complaint_ref: `CMP${new Date().getFullYear()}${String(i + 1).padStart(5, "0")}`,
        subject: subject,
        body: `This is a complaint regarding ${subject.toLowerCase()}. I have been experiencing this issue for some time and need assistance. Please look into this matter urgently.`,
        category: randomChoice(complaintCategories),
        priority: randomChoice(complaintPriorities),
        status: status,
        assigned_to: status === "in_progress" ? null : null, // Would be admin user ID in real scenario
        resolution_notes: status === "resolved" ? "Issue has been investigated and resolved. Member has been notified." : null,
        resolved_at: status === "resolved" ? new Date(createdAt.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000) : null,
        resolved_by: status === "resolved" ? null : null, // Would be admin user ID in real scenario
        satisfaction_rating: status === "resolved" ? randomInt(3, 5) : null,
        feedback: status === "resolved" && Math.random() > 0.5 ? "Thank you for resolving my issue promptly." : null,
        notes: Math.random() > 0.5 ? "Member contacted via phone" : null,
        created_at: createdAt,
        updated_at: new Date(),
      })
    }
    const insertedComplaints = await db.insert(complaints).values(complaintData).returning()
    console.log(`✅ Inserted ${insertedComplaints.length} complaints`)

    console.log("Seeding audit logs...")
    const actions = ["created", "updated", "deleted", "approved", "rejected"]
    const entities = ["member", "loan", "savings_account", "transaction", "fine"]
    const auditLogData: typeof auditLogs.$inferInsert[] = []
    
    for (let i = 0; i < 40; i++) {
      auditLogData.push({
        sacco_id: SACCO_ID,
        actor: randomChoice(["admin", "manager", "system"]),
        action: randomChoice(actions),
        entity: randomChoice(entities),
        entity_id: randomChoice(insertedMembers).id,
        diff: JSON.stringify({ before: {}, after: {} }),
        created_at: randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31)),
      })
    }
    const insertedAuditLogs = await db.insert(auditLogs).values(auditLogData).returning()
    console.log(`✅ Inserted ${insertedAuditLogs.length} audit logs`)

    console.log("Seeding loan guarantors...")
    const guarantorData: typeof loanGuarantors.$inferInsert[] = []
    const usedPairs = new Set<string>()
    
    for (let i = 0; i < 20; i++) {
      const loan = randomChoice(insertedLoans)
      const member = randomChoice(insertedMembers)
      const pairKey = `${loan.id}-${member.id}`
      
      if (!usedPairs.has(pairKey) && loan.member_id !== member.id) {
        usedPairs.add(pairKey)
        guarantorData.push({
          loan_id: loan.id,
          member_id: member.id,
          created_at: loan.created_at,
        })
      }
    }
    if (guarantorData.length > 0) {
      const insertedGuarantors = await db.insert(loanGuarantors).values(guarantorData).returning()
      console.log(`✅ Inserted ${insertedGuarantors.length} loan guarantors`)
    }

    console.log("Seeding loan extensions...")
    const extensionData: typeof loanExtensions.$inferInsert[] = []
    const extendedLoans = insertedLoans.filter(l => l.status === "extended" || l.status === "active")
    
    for (let i = 0; i < Math.min(15, extendedLoans.length); i++) {
      const loan = extendedLoans[i]
      const oldDueDate = new Date(loan.due_date || new Date())
      const newDueDate = new Date(oldDueDate.getTime() + randomInt(1, 3) * 30 * 24 * 60 * 60 * 1000)
      
      extensionData.push({
        loan_id: loan.id,
        old_due_date: formatDate(oldDueDate),
        new_due_date: formatDate(newDueDate),
        reason: randomChoice(["Financial difficulties", "Business delay", "Personal emergency", "Request for more time"]),
        created_at: new Date(oldDueDate.getTime() - randomInt(7, 14) * 24 * 60 * 60 * 1000),
      })
    }
    if (extensionData.length > 0) {
      const insertedExtensions = await db.insert(loanExtensions).values(extensionData).returning()
      console.log(`✅ Inserted ${insertedExtensions.length} loan extensions`)
    }

    console.log("\n🎉 Database seeding completed successfully!")
    console.log("\nSummary:")
    console.log(`- Members: ${insertedMembers.length}`)
    console.log(`- Loan Categories: ${insertedCategories.length}`)
    console.log(`- Interest Rates: ${insertedInterestRates.length}`)
    console.log(`- Loans: ${insertedLoans.length}`)
    console.log(`- Savings Categories: ${insertedSavingsCategories.length}`)
    console.log(`- Savings Accounts: ${insertedSavings.length}`)
    console.log(`- Transactions: ${insertedTransactions.length}`)
    console.log(`- Fine Categories: ${insertedFineCategories.length}`)
    console.log(`- Fines: ${insertedFines.length}`)
    console.log(`- Documents: ${insertedDocuments.length}`)
    console.log(`- Notifications: ${insertedNotifications.length}`)
    console.log(`- Complaints: ${insertedComplaints.length}`)
    console.log(`- Audit Logs: ${insertedAuditLogs.length}`)
    console.log(`- Loan Guarantors: ${guarantorData.length}`)
    console.log(`- Loan Extensions: ${extensionData.length}`)

  } catch (error) {
    console.error("❌ Seeding failed:", error)
    throw error
  } finally {
    await client.end()
  }
}

seed()
