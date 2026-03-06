import { NextResponse } from "next/server"

import { getOperatorDashboardData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const data = await getOperatorDashboardData()
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
