import { getAllDocuments, getMembersForDocuments } from "@/db/queries/documents"
import { DocumentsClient } from "./components/documents-client"

export default async function DocumentsPage() {
  const [docs, members] = await Promise.all([
    getAllDocuments(),
    getMembersForDocuments(),
  ])

  return <DocumentsClient documents={docs} members={members} />
}
