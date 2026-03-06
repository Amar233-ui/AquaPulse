import { NextResponse } from "next/server"

import { getAdminDevices, setDeviceEnabled } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["admin"])
    const url = new URL(request.url)
    const search = url.searchParams.get("search") ?? undefined
    const data = await getAdminDevices(search)
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUser(request, ["admin"])
    const body = (await request.json()) as { id?: string; enabled?: boolean }

    const id = body.id?.trim()
    if (!id || typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 })
    }

    await setDeviceEnabled(id, body.enabled)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}
