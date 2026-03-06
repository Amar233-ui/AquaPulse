import { NextResponse } from "next/server"

import { getMapData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["citoyen", "operateur", "admin"])
    const data = await getMapData()
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
