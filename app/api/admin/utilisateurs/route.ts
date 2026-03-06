import { NextResponse } from "next/server"

import { getAdminUsers, setUserStatus } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["admin"])
    const url = new URL(request.url)
    const search = url.searchParams.get("search") ?? undefined
    const data = await getAdminUsers(search)
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUser(request, ["admin"])
    const body = (await request.json()) as { id?: number; status?: boolean }

    const userId = Number(body.id)
    if (!Number.isInteger(userId) || typeof body.status !== "boolean") {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 })
    }

    await setUserStatus(userId, body.status)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}
