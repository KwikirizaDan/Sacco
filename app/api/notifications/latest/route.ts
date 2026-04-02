import { NextResponse } from "next/server"
import { getLatestNotifications } from "@/db/queries/notifications"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await getLatestNotifications(8)
    return NextResponse.json(notifications)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}