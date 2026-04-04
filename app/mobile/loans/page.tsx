import { requireMobileAuth } from "@/lib/mobile-session"
import { db } from "@/db"
import { loans, notifications } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { MobileStatusBar, MobilePageHeader } from "../components/mobile-ui"
import { MobileLoansClient } from "./mobile-loans-client"

export default async function MobileLoansPage() {
  const member = await requireMobileAuth()

  const memberLoans = await db
    .select()
    .from(loans)
    .where(eq(loans.member_id, member.id))
    .orderBy(desc(loans.created_at))

  return (
    <div style={{ background: "#0f1623", minHeight: "100dvh" }}>
      <MobileStatusBar />
      <MobilePageHeader title="Loans" subtitle="Request and manage loans" />
      <MobileLoansClient
        member={{ id: member.id, full_name: member.full_name, member_code: member.member_code, phone: member.phone }}
        loans={memberLoans}
        saccoId={SACCO_ID}
      />
    </div>
  )
}
