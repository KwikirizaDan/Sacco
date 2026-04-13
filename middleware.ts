import { NextResponse, type NextRequest } from "next/server"
import { getIronSession } from "iron-session"
import type { SessionData } from "@/lib/auth"

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "sacco_session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
}

const PUBLIC_PATHS = [
  "/auth/login",
  "/api/auth",
  "/api/auth/login",
  "/api/auth/logout",
  "/_next",
  "/favicon",
  "/sacco_logo",
  "/manifest",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(
    request,
    response,
    SESSION_OPTIONS
  )

  if (!session.isLoggedIn) {
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  const role = session.role
  if (pathname.startsWith("/dashboard/users") && role === "field_agent") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  if (pathname.startsWith("/dashboard/settings") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  if (pathname.startsWith("/dashboard/reports") && role === "field_agent") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
