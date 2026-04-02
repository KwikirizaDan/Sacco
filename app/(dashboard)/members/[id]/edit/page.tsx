import { db } from "@/db"
import { members } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { EditMemberForm } from "./edit-member-form"

interface EditMemberPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = await params

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, id))

  if (!member) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Member</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update details for {member.full_name}
        </p>
      </div>
      <EditMemberForm member={member} />
    </div>
  )
}