import { requireMobileAuth } from "@/lib/mobile-session"
import { db } from "@/db"
import { savingsAccounts, loans, fines, documents, transactions } from "@/db/schema"
import { eq, desc, sum, count } from "drizzle-orm"
import { MobileStatusBar, MobilePageHeader } from "../components/mobile-ui"
import { MobileProfileClient } from "./mobile-profile-client"

export default async function MobileProfilePage() {
  const member = await requireMobileAuth()

  const [savingsData] = await db
    .select({ total: sum(savingsAccounts.balance), accounts: count() })
    .from(savingsAccounts)
    .where(eq(savingsAccounts.member_id, member.id))

  const [loanData] = await db
    .select({ total: sum(loans.amount), count: count() })
    .from(loans)
    .where(eq(loans.member_id, member.id))

  const [txCount] = await db
    .select({ count: count() })
    .from(transactions)
    .where(eq(transactions.member_id, member.id))

  const memberDocs = await db
    .select({
      id: documents.id,
      type: documents.type,
      file_name: documents.file_name,
      blob_url: documents.blob_url,
      created_at: documents.created_at,
    })
    .from(documents)
    .where(eq(documents.member_id, member.id))
    .orderBy(desc(documents.created_at))

  return (
    <div style={{ background: "#0f1623", minHeight: "100dvh" }}>
      <MobileStatusBar />
      <MobilePageHeader title="Profile" subtitle="Your account details" />
      <MobileProfileClient
        member={{
          id: member.id,
          full_name: member.full_name,
          member_code: member.member_code,
          phone: member.phone,
          email: member.email,
          national_id: member.national_id,
          address: member.address,
          date_of_birth: member.date_of_birth,
          next_of_kin: member.next_of_kin,
          next_of_kin_phone: member.next_of_kin_phone,
          status: member.status,
          joined_at: member.joined_at,
        }}
        stats={{
          totalSavings: Number(savingsData?.total ?? 0),
          savingsAccounts: savingsData?.accounts ?? 0,
          totalLoans: loanData?.count ?? 0,
          transactions: txCount?.count ?? 0,
        }}
        documents={memberDocs}
      />
    </div>
  )
}
