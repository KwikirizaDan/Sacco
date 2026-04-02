"use server"

import { smartDb } from "@/lib/db/database-adapter"
import { documents } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import { SACCO_ID } from "@/lib/constants"

export type DocumentFormState = {
  success?: boolean
  error?: string
  url?: string
}

export async function uploadDocumentAction(
  prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  try {
    const file = formData.get("file") as File
    const member_id = formData.get("member_id") as string
    const type = formData.get("type") as string
    const loan_id = formData.get("loan_id") as string | null

    if (!file || file.size === 0) return { error: "No file provided." }
    if (!member_id) return { error: "Please select a member." }
    if (!type) return { error: "Please select document type." }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) return { error: "File too large. Max 10MB." }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) {
      return { error: "Only JPG, PNG, WEBP, and PDF files are allowed." }
    }

    const ext = file.name.split(".").pop()
    const filename = `documents/${SACCO_ID}/${member_id}/${type}-${Date.now()}.${ext}`

    const blob = await put(filename, file, { access: "public" })

    await smartDb.insert(documents).values({
      sacco_id: SACCO_ID,
      member_id,
      loan_id: loan_id || null,
      type: type as any,
      file_name: file.name,
      blob_url: blob.url,
    })

    revalidatePath("/documents")
    return { success: true, url: blob.url }
  } catch (err) {
    console.error(err)
    return { error: "Failed to upload document." }
  }
}

export async function deleteDocumentAction(
  id: string,
  blobUrl: string
): Promise<DocumentFormState> {
  try {
    await del(blobUrl)
    await smartDb.delete(documents).where(eq(documents.id, id))
    revalidatePath("/documents")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete document." }
  }
}
