import { getAllMembers } from "@/db/queries/members"
import { MembersClient } from "./components/members-client"

export default async function MembersPage() {
  const members = await getAllMembers()
  return <MembersClient members={members} />
}
