import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { db } from "@/db"
import { saccos } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const user = await requireRole("admin")
    const {
      saccoId,
      name,
      code,
      contact_email,
      contact_phone,
      address,
      website,
      registration_number,
      primary_color,
    } = await req.json()
    if (saccoId !== user.saccoId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    if (!name?.trim())
      return NextResponse.json(
        { error: "SACCO name is required." },
        { status: 400 }
      )
    await db
      .update(saccos)
      .set({
        name: name.trim(),
        code: code?.trim() || null,
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        address: address?.trim() || null,
        website: website?.trim() || null,
        registration_number: registration_number?.trim() || null,
        primary_color: primary_color || "#f97316",
        onboarding_completed: true,
        updated_at: new Date(),
      })
      .where(eq(saccos.id, saccoId))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[ONBOARDING]", err)
    return NextResponse.json({ error: "Failed to save." }, { status: 500 })
  }
}
