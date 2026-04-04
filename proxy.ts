import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMITS = {
  default: { windowMs: 15 * 60 * 1000, maxRequests: 10000 }, // 10000 requests per 15 min
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 8000 }, // 8000 requests per 15 min for auth
  api: { windowMs: 60 * 1000, maxRequests: 2400 }, // 2400 requests per minute for API
  mobile: { windowMs: 60 * 1000, maxRequests: 4000 }, // 4000 requests per minute for mobile pages
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const clientIP = request.headers.get("x-client-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (clientIP) {
    return clientIP
  }

  // In development, use a fixed IP to avoid rate limiting issues
  if (process.env.NODE_ENV === "development") {
    return "127.0.0.1"
  }

  // Fallback to a default or hash of user agent (not ideal but better than nothing)
  return request.headers.get("user-agent") || "unknown"
}

function getRateLimitConfig(pathname: string) {
  const authEndpoints = [
    "/api/mobile/send-otp",
    "/api/mobile/verify-otp",
    "/api/mobile/withdraw",
    "/api/mobile/deposit",
    "/api/mobile/deposit/confirm",
    "/api/mobile/pay-fine",
    "/api/mobile/request-loan",
    "/api/mobile/repay-loan",
    "/api/mobile/repay-loan/confirm",
    "/api/mobile/complaint",
    "/api/mobile/logout",
  ]

  const isAuthEndpoint = authEndpoints.some((ep) => pathname.includes(ep))

  if (isAuthEndpoint) {
    return RATE_LIMITS.auth // Stricter limits for auth and financial operations
  }
  if (pathname.startsWith("/api/")) {
    return RATE_LIMITS.api
  }
  if (pathname.startsWith("/mobile/")) {
    return RATE_LIMITS.mobile // Higher limits for mobile app usage
  }
  return RATE_LIMITS.default
}

function isRateLimited(
  ip: string,
  config: typeof RATE_LIMITS.default
): boolean {
  const now = Date.now()
  const key = `${ip}:${config.windowMs}`
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs })
    return false
  }

  if (record.count >= config.maxRequests) {
    return true
  }

  record.count++
  return false
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/manifest.json",
  "/sw.js",
  "/offline(.*)",
  "/icons(.*)",
  "/sacco_logo_dark.svg",
  "/sacco_logo_dark1.svg",
  "/sacco_logo_dark_pwa.svg",
  "/favicon.ico",
])

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname

  // Skip rate limiting in development for mobile routes
  if (
    process.env.NODE_ENV !== "development" &&
    !pathname.startsWith("/mobile/")
  ) {
    // Apply rate limiting
    const ip = getClientIP(request)
    const config = getRateLimitConfig(pathname)

    if (isRateLimited(ip, config)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(config.windowMs / 1000).toString(),
          },
        }
      )
    }
  }

  // Skip auth protection for public routes
  if (isPublicRoute(request)) {
    return
  }

  // Always require authentication - even in offline mode
  // The offline page is a public route, so it doesn't need auth
  await auth.protect()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
