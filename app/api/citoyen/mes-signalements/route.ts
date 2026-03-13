import { NextResponse } from "next/server"
import { getOperatorIncidents } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const url = new URL(request.url)
    const search = url.searchParams.get("search") ?? undefined
    const status = url.searchParams.get("status") ?? undefined
    const data = await getOperatorIncidents({ search, status })
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
