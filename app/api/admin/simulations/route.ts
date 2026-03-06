import { NextResponse } from "next/server"

import { getSimulations } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["admin", "operateur"])
    const data = await getSimulations()
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
