import { NextResponse } from "next/server"
import { getLatestNotifications } from "@/db/queries/notifications"

export async function GET() {
  try {
    const notifications = await getLatestNotifications(8)
    return NextResponse.json(notifications)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
