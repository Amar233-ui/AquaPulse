import { NextResponse } from "next/server"
import { updateEahFacilityStatus } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"
import type { EahFacilityStatus } from "@/lib/types"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const { id } = await params
    const body = (await request.json()) as { status?: string; notes?: string }
    const allowed: EahFacilityStatus[] = ["operationnel", "degradé", "hors_service"]
    if (!body.status || !allowed.includes(body.status as EahFacilityStatus)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }
    await updateEahFacilityStatus(Number(id), body.status as EahFacilityStatus, body.notes)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}
