import { getAllFines, getFinesStats } from "@/db/queries/fines"
import { db } from "@/db"
import { members, fineCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"
import { FinesClient } from "./components/fines-client"

export default async function FinesPage() {
  const [allFines, stats, allMembers, categories] = await Promise.all([
    getAllFines(),
    getFinesStats(),
    db
      .select({
        id: members.id,
        full_name: members.full_name,
        member_code: members.member_code,
        phone: members.phone,
      })
      .from(members)
      .where(eq(members.sacco_id, SACCO_ID))
      .orderBy(members.full_name),
    db
      .select()
      .from(fineCategories)
      .where(eq(fineCategories.sacco_id, SACCO_ID)),
  ])

  return (
    <FinesClient
      fines={allFines}
      stats={stats}
      members={allMembers}
      categories={categories}
    />
  )
}