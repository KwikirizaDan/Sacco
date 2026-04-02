import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

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
