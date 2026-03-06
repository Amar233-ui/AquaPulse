import { NextResponse } from "next/server"

import { getAdminDashboardData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["admin"])
    const data = await getAdminDashboardData()
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
