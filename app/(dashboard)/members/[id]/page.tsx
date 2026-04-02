import { db } from "@/db"
import { members } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { getMemberStatsAction } from "../actions"
import { MemberProfile } from "./member-profile"

interface MemberPageProps {
  params: Promise<{ id: string }>
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { id } = await params

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, id))

  if (!member) notFound()

  const data = await getMemberStatsAction(id)

  return (
    <MemberProfile
      member={member}
      loans={data?.loans ?? []}
      savings={data?.savings ?? []}
      fines={data?.fines ?? []}
      transactions={data?.transactions ?? []}
      stats={data?.stats ?? {
        totalSavings: 0,
        totalLoans: 0,
        totalFines: 0,
        totalTransactions: 0,
      }}
    />
  )
}