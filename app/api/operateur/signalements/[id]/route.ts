import { NextResponse } from "next/server"
import { updateIncidentStatus } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const { status } = (await request.json()) as { status?: string }
    const allowed = ["Nouveau", "En cours", "Résolu", "Fermé"] as const
    if (!status || !allowed.includes(status as typeof allowed[number])) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }
    await updateIncidentStatus(
      Number(params.id),
      status as "Nouveau" | "En cours" | "Résolu" | "Fermé"
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}
