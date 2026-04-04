import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-session"
import { db } from "@/db"
import {
  savingsAccounts,
  transactions,
  members,
  notifications,
} from "@/db/schema"
import { eq } from "drizzle-orm"
import { SACCO_ID } from "@/lib/constants"

export async function POST(req: Request) {
  try {
    const session = await getMobileSession()
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { account_id, amount, payment_method } = await req.json()
    if (!account_id || amount < 1000) {
      return NextResponse.json(
        { error: "Minimum deposit is UGX 10,000" },
        { status: 400 }
      )
    }

    const [account] = await db
      .select()
      .from(savingsAccounts)
      .where(eq(savingsAccounts.id, account_id))
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    if (account.member_id !== session.memberId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    if (account.is_locked)
      return NextResponse.json({ error: "Account is locked" }, { status: 400 })

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, session.memberId))

    const txRef = `SAV-DEPOSIT-${account_id}-${Date.now()}`
    const amountUGX = amount / 100

    return NextResponse.json({
      success: true,
      txRef,
      amount: amountUGX,
      phone: member?.phone,
      email: member?.email,
      fullname: member?.full_name,
      accountNumber: account.account_number,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Deposit failed" }, { status: 500 })
  }
}
