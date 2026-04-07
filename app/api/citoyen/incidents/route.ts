import { NextResponse } from "next/server"

import { createIncident, handleIncidentPointsFromAI } from "@/lib/server/data-service"
import { authErrorResponse, getUserFromRequest } from "@/lib/server/session"

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
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
      reporterUserId: user?.id ?? null,
      type,
      location,
      description,
      reporterName: body.reporterName,
      reporterEmail: body.reporterEmail,
      eahFacilityId: body.eahFacilityId ?? null,
    })

    const normalizedType = type.toLowerCase().trim()
    const isEahIncident =
      Boolean(body.eahFacilityId) ||
      normalizedType.includes("eah") ||
      normalizedType.includes("latrine") ||
      normalizedType.includes("hygiene") ||
      normalizedType.includes("lavage_mains") ||
      normalizedType.includes("panne_eah") ||
      normalizedType.includes("autre_eah")

    let ai: null | { awarded: number; reason: string; confidence: number; matchedAlertId: string } = null

    // Optional: AI correlation + points (only if authenticated and not an EAH incident)
    if (user?.id && !isEahIncident) {
      try {
        const { correlateIncidentLocal } = await import("@/lib/server/ai-local")
        const corr = await correlateIncidentLocal({
          id: incident.id,
          type,
          location,
          description,
        })

        if (corr.hasCorrelation && corr.correlations.length > 0) {
          const best = corr.correlations[0]
          const isCritical = best.severity === "critique"

          // Mirror handleIncidentPointsFromAI thresholds (for UI feedback)
          let reason = ""
          let awarded = 0
          if (isCritical && best.confidence >= 70) {
            reason = "signalement_critique"
            awarded = 20
          } else if (best.confidence >= 75) {
            reason = "signalement_valide_ia"
            awarded = 15
          } else if (best.confidence >= 50) {
            reason = "signalement_confirme"
            awarded = 10
          }

          if (awarded > 0) {
            await handleIncidentPointsFromAI(incident.id, best.confidence, isCritical)
            ai = {
              awarded,
              reason,
              confidence: best.confidence,
              matchedAlertId: best.alertId,
            }
          }
        }
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({
      ok: true,
      incidentId: incident.id,
      points: incident.points,
      ai,
      authenticated: Boolean(user),
    }, { status: 201 })
  } catch (error) {
    console.error("[incidents POST] Erreur:", error)
    return authErrorResponse(error)
  }
}
