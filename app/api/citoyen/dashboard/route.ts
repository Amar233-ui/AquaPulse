import { NextResponse } from "next/server"

import { getCitizenDashboardData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["citoyen", "admin", "operateur"])
    const { searchParams } = new URL(request.url)
    const quartier = searchParams.get("quartier") ?? undefined
    const data = await getCitizenDashboardData(quartier)
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
