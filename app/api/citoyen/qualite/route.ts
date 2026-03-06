import { NextResponse } from "next/server"

import { getCitizenQualityData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["citoyen", "admin", "operateur"])
    const data = await getCitizenQualityData()
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
