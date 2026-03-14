import { NextResponse } from "next/server"
import { getOperatorIncidents } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? undefined
    const status = searchParams.get("status") ?? undefined
    const data = await getOperatorIncidents({ search, status })
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
