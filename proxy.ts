import { NextRequest, NextResponse } from "next/server"

import { ROLE_HOME_PATH } from "@/lib/auth/roles"
import { SESSION_COOKIE_NAME, readCookieValue, verifySessionToken } from "@/lib/auth/session"
import type { UserRole } from "@/lib/types"

const PROTECTED_PREFIXES: Record<string, UserRole[]> = {
  "/citoyen": ["citoyen"],
  "/operateur": ["operateur", "admin"],
  "/admin": ["admin"],
}

function getRequiredRoles(pathname: string): UserRole[] | null {
  for (const [prefix, roles] of Object.entries(PROTECTED_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return roles
    }
  }

  return null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = readCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME)
  const session = token ? await verifySessionToken(token) : null

  if (pathname.startsWith("/auth/") && session) {
    const target = ROLE_HOME_PATH[session.role]
    return NextResponse.redirect(new URL(target, request.url))
  }

  const requiredRoles = getRequiredRoles(pathname)
  if (!requiredRoles) {
    return NextResponse.next()
  }

  if (!session) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!requiredRoles.includes(session.role)) {
    const fallback = ROLE_HOME_PATH[session.role]
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)"],
}
