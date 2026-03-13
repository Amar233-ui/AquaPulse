import { NextResponse } from "next/server"
import { getMyIncidents } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    const user = await requireUser(request, ["citoyen", "operateur", "admin"])
    const data = await getMyIncidents(user.id)
    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}
