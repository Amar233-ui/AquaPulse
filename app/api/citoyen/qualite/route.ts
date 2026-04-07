import { NextResponse } from "next/server"

import { getCitizenQualityData } from "@/lib/server/data-service"
import { authErrorResponse } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    const data = await getCitizenQualityData()
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
