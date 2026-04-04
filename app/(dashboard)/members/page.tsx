import { getAllMembers } from "@/db/queries/members"
import { MembersClient } from "./components/members-client"

export const dynamic = "force-dynamic"

export default async function MembersPage() {
  const members = await getAllMembers()
  return <MembersClient members={members} />
}
