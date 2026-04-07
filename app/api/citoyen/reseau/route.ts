import { NextResponse } from "next/server"

import { getCitizenNetworkData } from "@/lib/server/data-service"
import { authErrorResponse } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    const sectors = await getCitizenNetworkData()
    return NextResponse.json({ sectors })
  } catch (error) {
    return authErrorResponse(error)
  }
}
