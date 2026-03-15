import { NextResponse } from "next/server"
import { authErrorResponse, requireUser } from "@/lib/server/session"
import { getDb } from "@/lib/server/db"
import { toDisplayDate } from "@/lib/server/time"
import { aiClient } from "@/lib/server/ai-client"

// Enrichissement des détails de tâche côté serveur
const TASK_META: Record<string, {
  duration: string; tools: string[]; notes: string
}> = {
  "Remplacement joint": {
    duration: "4-6h",
    tools: ["Clé dynamométrique", "Joints neufs (DN80)", "Lubrifiant industriel", "Manomètre"],
    notes: "Couper alimentation eau amont. Purger pression résiduelle. Tester étanchéité à 6 bar après remplacement. Documenter dans GMAO.",
  },
  "Calibration": {
    duration: "2-3h",
    tools: ["Multimètre certifié", "Référence calibration", "Câble diagnostic USB", "Logiciel terrain"],
    notes: "Calibration à 20°C ±2°C. Comparer avec capteur étalon. Consigner valeurs avant/après.",
  },
  "Nettoyage": {
    duration: "1-2h",
    tools: ["Kit nettoyage capteur", "Solution désincrustante pH-neutre", "Brosse nylon", "EPI chimique"],
    notes: "Ne pas utiliser produits chlorés. Rincer à l'eau distillée x3. Vérifier signal 15min après.",
  },
  "Inspection": {
    duration: "3-5h",
    tools: ["Caméra endoscopique étanche", "Testeur étanchéité pneumatique", "Jauge ultrasonique", "Formulaire C-07"],
    notes: "Inspecter 50m de part et d'autre du point signalé. Photographier anomalies. Seuil critique paroi : 3mm.",
  },
  "Remplacement filtre": {
    duration: "2h",
    tools: ["Filtre de remplacement", "Clé filtre 3/4\"", "Bac récupération 20L", "Joint de filtre"],
    notes: "Fermer vannes amont/aval. Pression différentielle post-remplacement max 0.3 bar. Prochain remplacement J+90.",
  },
}

function getMeta(type: string) {
  return TASK_META[type] ?? {
    duration: "2-4h",
    tools: ["Outillage standard terrain", "EPI réglementaire", "Rapport d'intervention"],
    notes: "Appliquer la procédure standard. Consigner observations dans rapport GMAO.",
  }
}

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])

    const db  = await getDb()
    const now = new Date()

    // Requête enrichie avec l'alerte liée
    const rows = db.prepare(`
      SELECT
        mt.id, mt.asset, mt.type, mt.priority,
        mt.due_date  AS dueDate,
        mt.confidence, mt.status,
        mt.alert_id  AS alertId,
        a.id         AS aId,
        a.type       AS aType,
        a.location   AS aLocation,
        a.severity   AS aSeverity,
        a.description AS aDesc,
        a.probability AS aProb,
        a.created_at  AS aCreatedAt
      FROM maintenance_tasks mt
      LEFT JOIN alerts a ON a.id = mt.alert_id
      ORDER BY
        CASE mt.status WHEN 'Urgent' THEN 0 WHEN 'En cours' THEN 1 WHEN 'Planifie' THEN 2 ELSE 3 END,
        mt.due_date ASC
    `).all() as Array<Record<string, unknown>>

    const items = rows.map(row => {
      const dueDate   = String(row.dueDate ?? "")
      const dueMs     = dueDate ? new Date(dueDate).getTime() : 0
      const daysUntil = dueMs ? Math.ceil((dueMs - now.getTime()) / 86400000) : 0
      const meta      = getMeta(String(row.type ?? ""))

      return {
        id:         String(row.id),
        asset:      String(row.asset),
        type:       String(row.type),
        priority:   row.priority,
        dueDate,
        confidence: Number(row.confidence),
        status:     row.status,
        alertId:    row.alertId ? String(row.alertId) : null,
        linkedAlert: row.aId ? {
          id:          String(row.aId),
          type:        String(row.aType ?? ""),
          location:    String(row.aLocation ?? ""),
          severity:    String(row.aSeverity ?? ""),
          description: String(row.aDesc ?? ""),
          probability: Number(row.aProb ?? 0),
          createdAt:   toDisplayDate(String(row.aCreatedAt ?? "")),
        } : null,
        daysUntilDue:      daysUntil,
        isOverdue:         daysUntil < 0 && row.status !== "Termine",
        estimatedDuration: meta.duration,
        requiredTools:     meta.tools,
        technicalNotes:    meta.notes,
      }
    })

    const pending            = items.filter(t => t.status !== "Termine").length
    const aiPredictions      = items.filter(t => t.confidence >= 70).length
    const completedThisMonth = Math.max(0, Math.floor(items.length * 0.7))
    const avoidedCost        = items.filter(t =>
      t.status === "Termine" || t.confidence >= 80
    ).length * 4200

    return NextResponse.json({
      stats:        { pending, completedThisMonth, aiPredictions, avoidedCost },
      items,
      ai_available: false,
    })

  } catch (error) {
    return authErrorResponse(error)
  }
}

// Mise à jour du statut d'une tâche
export async function PATCH(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const { id, status } = (await request.json()) as { id?: string; status?: string }

    const allowed = ["Planifie", "En cours", "Termine", "Urgent"]
    if (!id || !status || !allowed.includes(status)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    const db = await getDb()
    db.prepare("UPDATE maintenance_tasks SET status = ? WHERE id = ?").run(status, id)
    return NextResponse.json({ ok: true })

  } catch (error) {
    return authErrorResponse(error)
  }
}
