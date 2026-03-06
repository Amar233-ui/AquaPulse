import { NextResponse } from "next/server"

import { getSensors } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const url = new URL(request.url)
    const search = url.searchParams.get("search") ?? undefined
    const data = await getSensors(search)
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
