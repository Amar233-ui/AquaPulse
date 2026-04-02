import { NextResponse } from "next/server"
import { getGlobalLeaderboard } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const data = await getGlobalLeaderboard()
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
