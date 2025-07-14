import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Force Node.js runtime for auth middleware
export const runtime = 'nodejs'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const isPublicRoute = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/api/auth/signup",
    "/listening",
    "/reading",
    "/writing",
    "/speaking",
  ].includes(nextUrl.pathname) || 
  nextUrl.pathname.startsWith("/api/auth/") ||
  nextUrl.pathname.startsWith("/api/listening/") ||
  nextUrl.pathname.startsWith("/api/reading/") ||
  nextUrl.pathname.startsWith("/api/writing/") ||
  nextUrl.pathname.startsWith("/listening/") ||
  nextUrl.pathname.startsWith("/reading/") ||
  nextUrl.pathname.startsWith("/writing/")

  // If user is not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl.origin))
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (isLoggedIn && ["/auth/signin", "/auth/signup"].includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
} 