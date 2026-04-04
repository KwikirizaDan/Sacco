import { redirect } from "next/navigation"
import { getMobileSession } from "@/lib/mobile-session"

export default async function MobileRootPage() {
  const session = await getMobileSession()
  if (session) {
    redirect("/mobile/home")
  } else {
    redirect("/mobile/login")
  }
}
