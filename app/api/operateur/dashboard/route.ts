import { NextResponse } from "next/server"
import { getOperatorDashboardData } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"
import { aiClient } from "@/lib/server/ai-client"
import type { OperatorDashboardData } from "@/lib/types"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])

    // ── DB data (toujours disponible) ─────────────────────────────────────
    const dbData = await getOperatorDashboardData()

    // ── AI KPIs + alertes live (si service disponible) ───────────────────
    const [
      { data: aiKPIs, fromAI: kpisFromAI },
      { data: aiAnomalies, fromAI: anomaliesFromAI },
    ] = await Promise.all([
      aiClient.getKPIs(),
      aiClient.getAnomalies(),
    ])

    if (!kpisFromAI) {
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

    const aiActivityFeed: NonNullable<OperatorDashboardData["activityFeed"]> = anomaliesFromAI
      ? aiAnomalies.alerts.slice(0, 3).map((alert) => ({
          id: `feed-ai-${alert.id}`,
          kind: "alerte" as const,
          title: alert.type,
          subtitle: `${alert.location} • ${alert.probability}% de confiance`,
          time: alert.date,
          severity: alert.severity,
          source: "ai" as const,
          href: "/operateur/alertes",
          ctaLabel: "Voir l'IA",
        }))
      : []

    const mergedActivityFeed = [...aiActivityFeed, ...(dbData.activityFeed ?? [])]
      .sort((a, b) => {
        const severityRank = (severity: "critique" | "alerte" | "moyen" | "faible" | "normal") =>
          severity === "critique" ? 0 : severity === "alerte" ? 1 : severity === "moyen" ? 2 : severity === "faible" ? 3 : 4
        const sourceRank = (source: NonNullable<OperatorDashboardData["activityFeed"]>[number]["source"]) =>
          source === "ai" ? 0 : source === "terrain" ? 1 : source === "maintenance" ? 2 : source === "eah" ? 3 : 4
        return severityRank(a.severity) - severityRank(b.severity) || sourceRank(a.source) - sourceRank(b.source)
      })
      .slice(0, 7)

    const mergedRequiredActions = [
      ...(anomaliesFromAI
        ? aiAnomalies.alerts
            .filter((alert) => alert.severity === "critique" || alert.severity === "alerte")
            .slice(0, 2)
            .map((alert) => ({
              id: `ai-action-${alert.id}`,
              type: "alerte" as const,
              label: `${alert.type} — ${alert.location}`,
              time: alert.date,
              urgency: alert.severity === "critique" ? "high" as const : "medium" as const,
              href: "/operateur/alertes",
              source: "ai" as const,
            }))
        : []),
      ...(dbData.requiredActions ?? []),
    ]
      .sort((a, b) => {
        const urgencyRank = (urgency: "high" | "medium" | "low") => urgency === "high" ? 0 : urgency === "medium" ? 1 : 2
        const sourceRank = (source: "db" | "ai" | "hybrid") => source === "ai" ? 0 : source === "hybrid" ? 1 : 2
        return urgencyRank(a.urgency) - urgencyRank(b.urgency) || sourceRank(a.source) - sourceRank(b.source)
      })
      .slice(0, 6)

    const systemStatus =
      anomaliesFromAI && aiKPIs.criticalAlerts > 0
        ? { label: "IA live sous tension", tone: "critical" as const }
        : dbData.systemStatus

    return NextResponse.json({
      ...dbData,
      kpis: enrichedKPIs,
      requiredActions: mergedRequiredActions,
      activityFeed: mergedActivityFeed,
      systemStatus,
      ai_available: true,
      ai_generated: anomaliesFromAI ? aiAnomalies.alerts.length : 0,
      model_version: anomaliesFromAI ? aiAnomalies.model_version : undefined,
    })

  } catch (error) {
    return authErrorResponse(error)
  }
}
