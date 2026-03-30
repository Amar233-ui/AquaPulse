import { NextResponse } from "next/server"

import { createIncident } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function POST(request: Request) {
  try {
    const user = await requireUser(request, ["citoyen", "admin", "operateur"])
    const body = (await request.json()) as {
      type?: string
      location?: string
      description?: string
      reporterName?: string
      reporterEmail?: string
      eahFacilityId?: number
    }

    const type = body.type?.trim() ?? ""
    const location = body.location?.trim() ?? ""
    const description = body.description?.trim() ?? ""

    if (!type || !location || !description) {
      return NextResponse.json({ error: "Type, localisation et description sont requis" }, { status: 400 })
    }

    const incident = await createIncident({
      reporterUserId: user.id,
      type,
      location,
      description,
      reporterName: body.reporterName,
      reporterEmail: body.reporterEmail,
      eahFacilityId: body.eahFacilityId ?? null,
    })

    return NextResponse.json({ ok: true, incidentId: incident.id }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}
