import { NextResponse } from "next/server"

import { verifyPassword } from "@/lib/auth/password"
import { findUserByEmail } from "@/lib/server/data-service"
import { normalizeServerError } from "@/lib/server/errors"
import { attachSessionCookie, touchUserLogin } from "@/lib/server/session"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }

    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 })
    }

    if (user.isActive !== 1) {
      return NextResponse.json({ error: "Compte desactive" }, { status: 403 })
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 })
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    await touchUserLogin(user.id)

    const response = NextResponse.json({ user: authUser })
    await attachSessionCookie(response, authUser)

    return response
  } catch (error) {
    const normalized = normalizeServerError(error)
    console.error("[auth/login]", normalized.detail ?? error)
    return NextResponse.json(
      {
        error: normalized.message,
        detail: process.env.NODE_ENV === "production" ? undefined : normalized.detail,
      },
      { status: normalized.status },
    )
  }
}
