import { NextResponse } from "next/server"
import { getEahFacilities, getEahDashboardData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode")

    if (mode === "dashboard") {
      const data = await getEahDashboardData()
      return NextResponse.json(data)
    }

    const quartier = searchParams.get("quartier") ?? undefined
    const status = searchParams.get("status") ?? undefined
    const type = searchParams.get("type") ?? undefined

    const facilities = await getEahFacilities({ quartier, status, type })
    return NextResponse.json({ items: facilities, total: facilities.length })
  } catch (error) {
    return authErrorResponse(error)
  }
}
