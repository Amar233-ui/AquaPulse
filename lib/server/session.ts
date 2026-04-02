import "server-only"

import { NextResponse } from "next/server"

import { SESSION_COOKIE_NAME, createSessionToken, readCookieValue, verifySessionToken } from "@/lib/auth/session"
import { isRoleAllowed } from "@/lib/auth/roles"
import { findStoredUserById, touchStoredUserLogin } from "@/lib/server/user-store"
import type { AuthUser, UserRole } from "@/lib/types"

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

export class AuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

async function findUserById(id: number): Promise<AuthUser | null> {
  const row = await findStoredUserById(id)

  if (!row || row.isActive !== 1) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  }
}

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const token = readCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME)
  if (!token) {
    return null
  }

  const payload = await verifySessionToken(token)
  if (!payload) {
    return null
  }

  const user = await findUserById(payload.sub)
  if (!user) {
    return null
  }

  return user
}

export async function requireUser(request: Request, allowedRoles?: UserRole[]): Promise<AuthUser> {
  const user = await getUserFromRequest(request)

  if (!user) {
    throw new AuthError("Authentification requise", 401)
  }

  if (allowedRoles && !isRoleAllowed(user.role, allowedRoles)) {
    throw new AuthError("Acces refuse pour ce role", 403)
  }

  return user
}

export async function attachSessionCookie(response: NextResponse, user: AuthUser) {
  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }, SESSION_MAX_AGE_SECONDS)

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  const detail = error instanceof Error ? error.message : String(error)
  console.error("[authErrorResponse]", detail)
  return NextResponse.json({ error: "Erreur interne", detail }, { status: 500 })
}

export async function touchUserLogin(userId: number) {
  await touchStoredUserLogin(userId)
}
