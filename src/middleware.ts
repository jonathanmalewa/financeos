import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isAuthPage = nextUrl.pathname.startsWith("/login") || 
                     nextUrl.pathname.startsWith("/register")
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth")
  const isPublic = isAuthPage || isApiAuth

  if (isPublic) {
    if (isLoggedIn && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Admin-only routes
  const adminOnlyPaths = ["/audit-log", "/users"]
  const isAdminOnly = adminOnlyPaths.some((path) => nextUrl.pathname.startsWith(path))
  
  if (isAdminOnly && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|api/auth).*)"],
}
