import { NextResponse } from "next/server"
import { getMaintenanceTasks } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"
import { aiClient } from "@/lib/server/ai-client"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])

    // ── 1. Tâches DB ─────────────────────────────────────────────────────
    const dbData = await getMaintenanceTasks()

    // ── 2. Scores IA ─────────────────────────────────────────────────────
    const { data: aiData, fromAI } = await aiClient.getMaintenance()

    if (!fromAI) {
      return NextResponse.json({ ...dbData, ai_available: false })
    }

    // ── 3. Nouvelles tâches IA (risques détectés mais pas encore en DB) ──
    const aiTasks = aiData.assets
      .filter(a => a.urgency === "urgent" || a.risk_score > 0.6)
      .map(a => ({
        id:         `AI-${a.asset_id}`,
        asset:      a.asset_name,
        type:       a.recommended_action,
        priority:   a.urgency === "urgent" ? "Haute" as const : "Moyenne" as const,
        dueDate:    a.due_date,
        confidence: Math.round(a.ai_confidence * 100),
        status:     a.urgency === "urgent" ? "Urgent" as const : "Planifie" as const,
        ai_risk_score: a.risk_score,
        source_type: "ai_generated" as const,
      }))

    // ── 4. Fusion : IA en premier si urgentes, puis DB ───────────────────
    const allItems = [...aiTasks, ...(dbData.items ?? [])]

    const stats = {
      pending:            allItems.filter(t => t.status !== "Termine").length,
      completedThisMonth: (dbData.stats?.completedThisMonth ?? 0),
      aiPredictions:      aiTasks.length,
      avoidedCost:        (dbData.stats?.avoidedCost ?? 0) + aiTasks.length * 15,
    }

    return NextResponse.json({
      stats,
      items:        allItems,
      ai_available: true,
    })

  } catch (error) {
    return authErrorResponse(error)
  }
}
