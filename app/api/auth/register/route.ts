import { NextResponse } from "next/server"

import { hashPassword } from "@/lib/auth/password"
import { normalizeRoleLabel } from "@/lib/auth/roles"
import { createUser, findUserByEmail } from "@/lib/server/data-service"
import { attachSessionCookie } from "@/lib/server/session"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      email?: string
      password?: string
      role?: string
    }

    const name = body.name?.trim() ?? ""
    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""
    const role = normalizeRoleLabel(body.role ?? "")

    if (name.length < 2) {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 })
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caracteres" }, { status: 400 })
    }

    if (!role) {
      return NextResponse.json({ error: "Role invalide" }, { status: 400 })
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "Cet email est deja utilise" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({
      name,
      email,
      role,
      passwordHash,
    })

    const response = NextResponse.json({ user }, { status: 201 })
    await attachSessionCookie(response, user)

    return response
  } catch {
    return NextResponse.json({ error: "Impossible de creer le compte" }, { status: 500 })
  }
}
