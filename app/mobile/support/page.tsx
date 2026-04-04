import { requireMobileAuth } from "@/lib/mobile-session"
import { db } from "@/db"
import { complaints } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { MobileStatusBar, MobilePageHeader } from "../components/mobile-ui"
import { MobileSupportClient } from "./mobile-support-client"

export default async function MobileSupportPage() {
  const member = await requireMobileAuth()

  const memberComplaints = await db
    .select()
    .from(complaints)
    .where(eq(complaints.member_id, member.id))
    .orderBy(desc(complaints.created_at))

  return (
    <div style={{ background: "#0f1623", minHeight: "100dvh" }}>
      <MobileStatusBar />
      <MobilePageHeader title="Support" subtitle="Submit complaints and track issues" />
      <MobileSupportClient complaints={memberComplaints} />
    </div>
  )
}
