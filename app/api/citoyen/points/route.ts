import { NextResponse } from "next/server"
import { getCitizenPointsProfile } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    const user = await requireUser(request, ["citoyen", "admin", "operateur"])
    const profile = await getCitizenPointsProfile(user.id)
    return NextResponse.json(profile)
  } catch (error) {
    return authErrorResponse(error)
  }
}
