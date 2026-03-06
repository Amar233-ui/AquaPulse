import { NextResponse } from "next/server"

import { getOperatorAlerts } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const url = new URL(request.url)
    const search = url.searchParams.get("search") ?? undefined
    const severity = url.searchParams.get("severity") ?? undefined
    const classification = url.searchParams.get("classification") ?? undefined

    const data = await getOperatorAlerts({ search, severity, classification })
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
