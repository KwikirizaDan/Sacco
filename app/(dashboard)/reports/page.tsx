import { db } from "@/db"
import {
  loans,
  members,
  savingsAccounts,
  fines,
  transactions,
  complaints,
  notifications,
  interestRates,
  loanCategories,
  savingsCategories,
  fineCategories,
} from "@/db/schema"
import { eq, sum, count, desc, and, gte, lte, sql } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { ReportsClient } from "./components/reports-client"

export default async function ReportsPage() {
  // ─── Loan Stats ───────────────────────────────────────────────────────────
  const [loanStats] = await db
    .select({
      total: sum(loans.amount),
      count: count(),
      totalExpected: sum(loans.expected_received),
    })
    .from(loans)
    .where(eq(loans.sacco_id, SACCO_ID))

  const [activeLoans] = await db
    .select({ total: sum(loans.balance), count: count() })
    .from(loans)
    .where(and(eq(loans.sacco_id, SACCO_ID), eq(loans.status, "active")))

  const [disbursedLoans] = await db
    .select({ total: sum(loans.amount), count: count() })
    .from(loans)
    .where(and(eq(loans.sacco_id, SACCO_ID), eq(loans.status, "disbursed")))

  const [approvedLoans] = await db
    .select({ count: count() })
    .from(loans)
    .where(and(eq(loans.sacco_id, SACCO_ID), eq(loans.status, "approved")))

  const [pendingLoans] = await db
    .select({ count: count() })
    .from(loans)
    .where(and(eq(loans.sacco_id, SACCO_ID), eq(loans.status, "pending")))

  const [settledLoans] = await db
    .select({ count: count() })
    .from(loans)
    .where(and(eq(loans.sacco_id, SACCO_ID), eq(loans.status, "settled")))

  const [defaultedLoans] = await db
    .select({ count: count() })
    .from(loans)
    .where(and(eq(loans.sacco_id, SACCO_ID), eq(loans.status, "defaulted")))

  // ─── Savings Stats ────────────────────────────────────────────────────────
  const [savingsStats] = await db
    .select({ total: sum(savingsAccounts.balance), count: count() })
    .from(savingsAccounts)
    .where(eq(savingsAccounts.sacco_id, SACCO_ID))

  const [fixedSavings] = await db
    .select({ total: sum(savingsAccounts.balance), count: count() })
    .from(savingsAccounts)
    .where(
      and(
        eq(savingsAccounts.sacco_id, SACCO_ID),
        eq(savingsAccounts.account_type, "fixed")
      )
    )

  const [lockedSavings] = await db
    .select({ count: count() })
    .from(savingsAccounts)
    .where(
      and(
        eq(savingsAccounts.sacco_id, SACCO_ID),
        eq(savingsAccounts.is_locked, true)
      )
    )

  // ─── Member Stats ─────────────────────────────────────────────────────────
  const [memberStats] = await db
    .select({ count: count() })
    .from(members)
    .where(eq(members.sacco_id, SACCO_ID))

  const [activeMembers] = await db
    .select({ count: count() })
    .from(members)
    .where(and(eq(members.sacco_id, SACCO_ID), eq(members.status, "active")))

  const [suspendedMembers] = await db
    .select({ count: count() })
    .from(members)
    .where(and(eq(members.sacco_id, SACCO_ID), eq(members.status, "suspended")))

  const [exitedMembers] = await db
    .select({ count: count() })
    .from(members)
    .where(and(eq(members.sacco_id, SACCO_ID), eq(members.status, "exited")))

  // ─── Fine Stats ───────────────────────────────────────────────────────────
  const [fineStats] = await db
    .select({ total: sum(fines.amount), count: count() })
    .from(fines)
    .where(eq(fines.sacco_id, SACCO_ID))

  const [pendingFines] = await db
    .select({ total: sum(fines.amount), count: count() })
    .from(fines)
    .where(and(eq(fines.sacco_id, SACCO_ID), eq(fines.status, "pending")))

  const [paidFines] = await db
    .select({ total: sum(fines.amount), count: count() })
    .from(fines)
    .where(and(eq(fines.sacco_id, SACCO_ID), eq(fines.status, "paid")))

  const [waivedFines] = await db
    .select({ total: sum(fines.amount), count: count() })
    .from(fines)
    .where(and(eq(fines.sacco_id, SACCO_ID), eq(fines.status, "waived")))

  // ─── Transaction Stats ────────────────────────────────────────────────────
  const [totalDeposits] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.sacco_id, SACCO_ID),
        eq(transactions.type, "savings_deposit")
      )
    )

  const [totalWithdrawals] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.sacco_id, SACCO_ID),
        eq(transactions.type, "savings_withdrawal")
      )
    )

  const [totalRepayments] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.sacco_id, SACCO_ID),
        eq(transactions.type, "loan_repayment")
      )
    )

  // ─── Complaint Stats ──────────────────────────────────────────────────────
  const [complaintStats] = await db
    .select({ count: count() })
    .from(complaints)
    .where(eq(complaints.sacco_id, SACCO_ID))

  const [openComplaints] = await db
    .select({ count: count() })
    .from(complaints)
    .where(
      and(eq(complaints.sacco_id, SACCO_ID), eq(complaints.status, "open"))
    )

  const [resolvedComplaints] = await db
    .select({ count: count() })
    .from(complaints)
    .where(
      and(eq(complaints.sacco_id, SACCO_ID), eq(complaints.status, "resolved"))
    )

  // ─── Notification Stats ───────────────────────────────────────────────────
  const [notificationStats] = await db
    .select({ count: count() })
    .from(notifications)
    .where(eq(notifications.sacco_id, SACCO_ID))

  const [sentNotifications] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.sacco_id, SACCO_ID),
        eq(notifications.status, "sent")
      )
    )

  const [failedNotifications] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.sacco_id, SACCO_ID),
        eq(notifications.status, "failed")
      )
    )

  // ─── Detailed Data for Tables ─────────────────────────────────────────────

  // All loans with member and category details
  const allLoans = await db
    .select({
      id: loans.id,
      loan_ref: loans.loan_ref,
      amount: loans.amount,
      expected_received: loans.expected_received,
      balance: loans.balance,
      interest_rate: loans.interest_rate,
      interest_type: loans.interest_type,
      duration_months: loans.duration_months,
      daily_payment: loans.daily_payment,
      monthly_payment: loans.monthly_payment,
      late_penalty_fee: loans.late_penalty_fee,
      status: loans.status,
      due_date: loans.due_date,
      created_at: loans.created_at,
      disbursed_at: loans.disbursed_at,
      settled_at: loans.settled_at,
      notes: loans.notes,
      member_id: loans.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
      category_name: loanCategories.name,
    })
    .from(loans)
    .leftJoin(members, eq(loans.member_id, members.id))
    .leftJoin(loanCategories, eq(loans.category_id, loanCategories.id))
    .where(eq(loans.sacco_id, SACCO_ID))
    .orderBy(desc(loans.created_at))
    .limit(200)

  // All savings accounts with member details
  const allSavings = await db
    .select({
      id: savingsAccounts.id,
      account_number: savingsAccounts.account_number,
      balance: savingsAccounts.balance,
      account_type: savingsAccounts.account_type,
      is_locked: savingsAccounts.is_locked,
      lock_until: savingsAccounts.lock_until,
      created_at: savingsAccounts.created_at,
      member_id: savingsAccounts.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
      category_name: savingsCategories.name,
    })
    .from(savingsAccounts)
    .leftJoin(members, eq(savingsAccounts.member_id, members.id))
    .leftJoin(
      savingsCategories,
      eq(savingsAccounts.category_id, savingsCategories.id)
    )
    .where(eq(savingsAccounts.sacco_id, SACCO_ID))
    .orderBy(desc(savingsAccounts.balance))
    .limit(200)

  // All members
  const allMembers = await db
    .select()
    .from(members)
    .where(eq(members.sacco_id, SACCO_ID))
    .orderBy(desc(members.created_at))
    .limit(200)

  // All fines with member and category details
  const allFines = await db
    .select({
      id: fines.id,
      fine_ref: fines.fine_ref,
      amount: fines.amount,
      reason: fines.reason,
      description: fines.description,
      status: fines.status,
      priority: fines.priority,
      due_date: fines.due_date,
      paid_at: fines.paid_at,
      payment_method: fines.payment_method,
      payment_reference: fines.payment_reference,
      notes: fines.notes,
      created_at: fines.created_at,
      member_id: fines.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
      category_name: fineCategories.name,
    })
    .from(fines)
    .leftJoin(members, eq(fines.member_id, members.id))
    .leftJoin(fineCategories, eq(fines.category_id, fineCategories.id))
    .where(eq(fines.sacco_id, SACCO_ID))
    .orderBy(desc(fines.created_at))
    .limit(200)

  // All transactions
  const allTransactions = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      balance_after: transactions.balance_after,
      payment_method: transactions.payment_method,
      narration: transactions.narration,
      created_at: transactions.created_at,
      member_id: transactions.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
    })
    .from(transactions)
    .leftJoin(members, eq(transactions.member_id, members.id))
    .where(eq(transactions.sacco_id, SACCO_ID))
    .orderBy(desc(transactions.created_at))
    .limit(200)

  // All complaints
  const allComplaints = await db
    .select({
      id: complaints.id,
      complaint_ref: complaints.complaint_ref,
      subject: complaints.subject,
      body: complaints.body,
      category: complaints.category,
      priority: complaints.priority,
      status: complaints.status,
      resolution_notes: complaints.resolution_notes,
      satisfaction_rating: complaints.satisfaction_rating,
      feedback: complaints.feedback,
      created_at: complaints.created_at,
      resolved_at: complaints.resolved_at,
      member_id: complaints.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
      member_phone: members.phone,
    })
    .from(complaints)
    .leftJoin(members, eq(complaints.member_id, members.id))
    .where(eq(complaints.sacco_id, SACCO_ID))
    .orderBy(desc(complaints.created_at))
    .limit(200)

  // All notifications
  const allNotifications = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      type: notifications.type,
      status: notifications.status,
      priority: notifications.priority,
      channel: notifications.channel,
      scheduled_at: notifications.scheduled_at,
      sent_at: notifications.sent_at,
      delivered_at: notifications.delivered_at,
      read_at: notifications.read_at,
      created_at: notifications.created_at,
      member_id: notifications.member_id,
      member_name: members.full_name,
      member_code: members.member_code,
    })
    .from(notifications)
    .leftJoin(members, eq(notifications.member_id, members.id))
    .where(eq(notifications.sacco_id, SACCO_ID))
    .orderBy(desc(notifications.created_at))
    .limit(200)

  // Interest rates table
  const interestRatesList = await db
    .select()
    .from(interestRates)
    .where(eq(interestRates.sacco_id, SACCO_ID))
    .orderBy(interestRates.min_amount)

  // Loan categories
  const loanCategoriesList = await db
    .select()
    .from(loanCategories)
    .where(eq(loanCategories.sacco_id, SACCO_ID))

  // Savings categories
  const savingsCategoriesList = await db
    .select()
    .from(savingsCategories)
    .where(eq(savingsCategories.sacco_id, SACCO_ID))

  // Fine categories
  const fineCategoriesList = await db
    .select()
    .from(fineCategories)
    .where(eq(fineCategories.sacco_id, SACCO_ID))

  return (
    <ReportsClient
      stats={{
        // Loans
        totalLoansAmount: Number(loanStats?.total ?? 0),
        totalExpectedAmount: Number(loanStats?.totalExpected ?? 0),
        totalLoansCount: loanStats?.count ?? 0,
        activeLoansAmount: Number(activeLoans?.total ?? 0),
        activeLoansCount: activeLoans?.count ?? 0,
        disbursedLoansAmount: Number(disbursedLoans?.total ?? 0),
        disbursedLoansCount: disbursedLoans?.count ?? 0,
        approvedLoansCount: approvedLoans?.count ?? 0,
        pendingLoansCount: pendingLoans?.count ?? 0,
        settledLoansCount: settledLoans?.count ?? 0,
        defaultedLoansCount: defaultedLoans?.count ?? 0,

        // Savings
        totalSavings: Number(savingsStats?.total ?? 0),
        savingsCount: savingsStats?.count ?? 0,
        fixedSavingsAmount: Number(fixedSavings?.total ?? 0),
        fixedSavingsCount: fixedSavings?.count ?? 0,
        lockedSavingsCount: lockedSavings?.count ?? 0,

        // Members
        totalMembers: memberStats?.count ?? 0,
        activeMembers: activeMembers?.count ?? 0,
        suspendedMembers: suspendedMembers?.count ?? 0,
        exitedMembers: exitedMembers?.count ?? 0,

        // Fines
        totalFines: Number(fineStats?.total ?? 0),
        finesCount: fineStats?.count ?? 0,
        pendingFinesAmount: Number(pendingFines?.total ?? 0),
        pendingFinesCount: pendingFines?.count ?? 0,
        paidFinesAmount: Number(paidFines?.total ?? 0),
        paidFinesCount: paidFines?.count ?? 0,
        waivedFinesAmount: Number(waivedFines?.total ?? 0),
        waivedFinesCount: waivedFines?.count ?? 0,

        // Transactions
        totalDeposits: Number(totalDeposits?.total ?? 0),
        totalWithdrawals: Number(totalWithdrawals?.total ?? 0),
        totalRepayments: Number(totalRepayments?.total ?? 0),

        // Complaints
        totalComplaints: complaintStats?.count ?? 0,
        openComplaints: openComplaints?.count ?? 0,
        resolvedComplaints: resolvedComplaints?.count ?? 0,

        // Notifications
        totalNotifications: notificationStats?.count ?? 0,
        sentNotifications: sentNotifications?.count ?? 0,
        failedNotifications: failedNotifications?.count ?? 0,
      }}
      loans={allLoans}
      savings={allSavings}
      members={allMembers}
      fines={allFines}
      transactions={allTransactions}
      complaints={allComplaints}
      notifications={allNotifications}
      interestRates={interestRatesList}
      loanCategories={loanCategoriesList}
      savingsCategories={savingsCategoriesList}
      fineCategories={fineCategoriesList}
    />
  )
}
