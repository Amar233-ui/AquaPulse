import { NextResponse } from "next/server"

import { getSettings, updateSettings } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"
import type { AppSettings } from "@/lib/types"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["admin"])
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PUT(request: Request) {
  try {
    await requireUser(request, ["admin"])
    const body = (await request.json()) as AppSettings

    if (!body.orgName || !body.timezone || !body.apiKey) {
      return NextResponse.json({ error: "Parametres invalides" }, { status: 400 })
    }

    await updateSettings(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}
