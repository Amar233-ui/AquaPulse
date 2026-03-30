import { NextResponse } from "next/server"
import { getOperatorAlerts } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"
import { aiClient, type AIAnomaly } from "@/lib/server/ai-client"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])

    const url    = new URL(request.url)
    const search = url.searchParams.get("search")         ?? undefined
    const sev    = url.searchParams.get("severity")       ?? undefined
    const classi = url.searchParams.get("classification") ?? undefined

    // ── 1. Alertes DB existantes ──────────────────────────────────────────
    const dbData = await getOperatorAlerts({ search, severity: sev, classification: classi })

    // ── 2. Alertes IA temps réel ──────────────────────────────────────────
    const { data: aiData, fromAI } = await aiClient.getAnomalies()

    if (!fromAI) {
      // Service IA indisponible → retourner uniquement les alertes DB
      return NextResponse.json({ ...dbData, ai_available: false })
    }

    // ── 3. Conversion format AI → format OperatorAlert ────────────────────
    const aiAlerts = aiData.alerts.map((a: AIAnomaly) => ({
      id:             a.id,
      type:           a.type,
      classification: a.classification,
      location:       a.location,
      severity:       a.severity as "critique" | "alerte" | "moyen" | "faible",
      probability:    `${a.probability}%`,
      date:           a.date,
      status:         a.status,
      description:    a.description,
      source_type:    "ai_generated" as const,
    }))

    // ── 4. Fusion : alertes IA en premier (plus fraîches), puis DB ────────
    const allAlerts = [...aiAlerts, ...dbData.items]

    // Appliquer les filtres si présents
    const filtered = allAlerts.filter(alert => {
      if (search) {
        const q = search.toLowerCase()
        if (!alert.type.toLowerCase().includes(q) &&
            !alert.location.toLowerCase().includes(q)) return false
      }
      if (sev && sev !== "all" && alert.severity !== sev) return false
      if (classi && classi !== "all" && alert.classification !== classi) return false
      return true
    })

    // Recalculer le summary sur la liste fusionnée
    const summary = {
      critique: filtered.filter(a => a.severity === "critique").length,
      alerte:   filtered.filter(a => a.severity === "alerte").length,
      moyen:    filtered.filter(a => a.severity === "moyen").length,
      faible:   filtered.filter(a => a.severity === "faible").length,
    }

    return NextResponse.json({
      items:         filtered,
      summary,
      ai_available:  true,
      ai_generated:  aiAlerts.length,
      model_version: aiData.model_version,
    })

  } catch (error) {
    return authErrorResponse(error)
  }
}
