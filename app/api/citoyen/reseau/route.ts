import { NextResponse } from "next/server"

import { getCitizenNetworkData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["citoyen", "admin", "operateur"])
    const sectors = await getCitizenNetworkData()
    return NextResponse.json({ sectors })
  } catch (error) {
    return authErrorResponse(error)
  }
}
