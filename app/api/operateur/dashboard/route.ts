import { NextResponse } from "next/server"
import { getOperatorDashboardData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"
import { aiClient } from "@/lib/server/ai-client"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])

    // ── DB data (toujours disponible) ─────────────────────────────────────
    const dbData = await getOperatorDashboardData()

    // ── AI KPIs (si service disponible) ──────────────────────────────────
    const { data: aiKPIs, fromAI } = await aiClient.getKPIs()

    if (!fromAI) {
      return NextResponse.json({ ...dbData, ai_available: false })
    }

    // Enrichir les KPIs DB avec les prédictions IA
    const enrichedKPIs = {
      ...dbData.kpis,
      // Les valeurs IA remplacent les valeurs statiques DB
      leakDetections:    aiKPIs.leakDetections,
      activeAlerts:      aiKPIs.activeAlerts,
      criticalAlerts:    aiKPIs.criticalAlerts,
      networkHealth:     aiKPIs.networkHealth,
      // Nouvelles métriques IA
      predictedLeaks24h:  aiKPIs.predictedLeaks24h,
      maintenanceUrgent:  aiKPIs.maintenanceUrgent,
      qualityScore:       aiKPIs.qualityScore,
      qualityTrend:       aiKPIs.qualityTrend,
    }

    return NextResponse.json({
      ...dbData,
      kpis:         enrichedKPIs,
      ai_available: true,
    })

  } catch (error) {
    return authErrorResponse(error)
  }
}
