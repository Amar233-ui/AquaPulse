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

function buildTaskFromAlert(alert: {
  id: string
  type: string
  location: string
  severity: string
  probability: number
}) {
  const normalizedType = alert.type.toLowerCase()

  let type = "Inspection"
  let asset = alert.location

  if (normalizedType.includes("pompe")) {
    type = "Remplacement joint"
    asset = alert.location.replace("Station Pompage ", "")
  } else if (normalizedType.includes("pression")) {
    type = "Calibration"
  } else if (normalizedType.includes("contamination") || normalizedType.includes("temperature")) {
    type = "Nettoyage"
  } else if (normalizedType.includes("fuite") || normalizedType.includes("debit")) {
    type = "Inspection"
  } else if (normalizedType.includes("fraude")) {
    type = "Inspection"
  }

  const priority =
    alert.severity === "critique" ? "Haute"
    : alert.severity === "alerte" ? "Moyenne"
    : "Basse"

  const status = alert.severity === "critique" ? "Urgent" : "Planifie"
  const dueDays = alert.severity === "critique" ? 1 : alert.severity === "alerte" ? 3 : 7
  const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().slice(0, 10)
  const confidence = Math.max(35, Math.min(99, Math.round(alert.probability)))

  return { type, asset, priority, status, dueDate, confidence }
}

function buildTaskFromEahFacility(facility: {
  id: number
  name: string
  type: string
  quartier: string
  status: string
  schoolNearby?: boolean
  genderAccessible?: boolean
}) {
  const priority =
    facility.status === "hors_service"
      ? "Haute"
      : facility.schoolNearby || facility.genderAccessible
        ? "Moyenne"
        : "Basse"

  const status = facility.status === "hors_service" ? "Urgent" : "Planifie"
  const dueDays = facility.status === "hors_service" ? 1 : facility.schoolNearby ? 2 : 4
  const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().slice(0, 10)
  const confidence = facility.status === "hors_service" ? 91 : facility.status === "degradé" ? 78 : 62

  let type = "Inspection"
  if (facility.type.includes("latrine")) type = "Réhabilitation EAH"
  if (facility.type.includes("borne") || facility.type.includes("point_eau")) type = "Remise en service hydraulique"
  if (facility.type.includes("lavage") || facility.type.includes("bloc_hygiene")) type = "Maintenance sanitaire"

  return {
    type,
    asset: `${facility.name} — ${facility.quartier}`,
    priority,
    status,
    dueDate,
    confidence,
  }
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function priorityFromUrgency(urgency: "urgent" | "planifier" | "surveiller") {
  if (urgency === "urgent") return "Haute" as const
  if (urgency === "planifier") return "Moyenne" as const
  return "Basse" as const
}

function statusFromUrgency(urgency: "urgent" | "planifier" | "surveiller") {
  if (urgency === "urgent") return "Urgent" as const
  if (urgency === "planifier") return "Planifie" as const
  return "Planifie" as const
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
        mt.eah_facility_id AS eahFacilityId,
        mt.assigned_operator_id AS assignedOperatorId,
        mt.assigned_operator_name AS assignedOperatorName,
        mt.assigned_at AS assignedAt,
        a.id         AS aId,
        a.type       AS aType,
        a.location   AS aLocation,
        a.severity   AS aSeverity,
        a.description AS aDesc,
        a.probability AS aProb,
        a.created_at  AS aCreatedAt,
        ef.name      AS eName,
        ef.type      AS eType,
        ef.quartier  AS eQuartier,
        ef.address   AS eAddress,
        ef.status    AS eStatus
      FROM maintenance_tasks mt
      LEFT JOIN alerts a ON a.id = mt.alert_id
      LEFT JOIN eah_facilities ef ON ef.id = mt.eah_facility_id
      ORDER BY
        CASE mt.status WHEN 'Urgent' THEN 0 WHEN 'En cours' THEN 1 WHEN 'Planifie' THEN 2 ELSE 3 END,
        mt.due_date ASC
    `).all() as Array<Record<string, unknown>>

    const alertRows = db.prepare(`
      SELECT id, type, location, severity, description, probability, created_at as createdAt
      FROM alerts
      ORDER BY datetime(created_at) DESC
    `).all() as Array<{
      id: string
      type: string
      location: string
      severity: string
      description: string | null
      probability: number
      createdAt: string
    }>

    const dbItems = rows.map(row => {
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
        eahFacilityId: row.eahFacilityId ? Number(row.eahFacilityId) : null,
        assignedOperatorId: row.assignedOperatorId ? Number(row.assignedOperatorId) : null,
        assignedOperatorName: row.assignedOperatorName ? String(row.assignedOperatorName) : null,
        assignedAt: row.assignedAt ? toDisplayDate(String(row.assignedAt)) : null,
        linkedAlert: row.aId ? {
          id:          String(row.aId),
          type:        String(row.aType ?? ""),
          location:    String(row.aLocation ?? ""),
          severity:    String(row.aSeverity ?? ""),
          description: String(row.aDesc ?? ""),
          probability: Number(row.aProb ?? 0),
          createdAt:   toDisplayDate(String(row.aCreatedAt ?? "")),
        } : null,
        linkedEah: row.eName ? {
          id: Number(row.eahFacilityId ?? 0),
          name: String(row.eName),
          type: String(row.eType ?? ""),
          quartier: String(row.eQuartier ?? ""),
          address: String(row.eAddress ?? ""),
          status: String(row.eStatus ?? ""),
        } : null,
        daysUntilDue:      daysUntil,
        isOverdue:         daysUntil < 0 && row.status !== "Termine",
        estimatedDuration: meta.duration,
        requiredTools:     meta.tools,
        technicalNotes:    meta.notes,
      }
    })

    const { data: aiMaintenance, fromAI } = await aiClient.getMaintenance()
    const existingKeys = new Set(
      dbItems.map((item) => normalizeText(`${item.asset}|${item.type}`)),
    )

    const aiItems = fromAI
      ? aiMaintenance.assets
          .filter((asset) => asset.urgency !== "surveiller")
          .map((asset, index) => {
            const locationPart = asset.asset_name.split(" — ")[1] ?? asset.asset_name
            const normalizedLocation = normalizeText(locationPart)
            const linkedAlertRow = alertRows.find((alert) => {
              const alertLocation = normalizeText(alert.location)
              return (
                alert.id.includes(asset.asset_id) ||
                alertLocation.includes(normalizedLocation) ||
                normalizedLocation.includes(alertLocation)
              )
            })

            const taskType = asset.recommended_action.includes("Calibration")
              ? "Calibration"
              : asset.recommended_action.includes("Inspection")
                ? "Inspection"
                : asset.recommended_action.includes("vérification") || asset.recommended_action.includes("Vérification")
                  ? "Inspection"
                  : "Inspection"

            const meta = getMeta(taskType)
            const task = {
              id: `AI-MT-${asset.asset_id}`,
              asset: asset.asset_name,
              type: taskType,
              priority: priorityFromUrgency(asset.urgency),
              dueDate: asset.due_date,
              confidence: Math.round(asset.risk_percent),
              status: statusFromUrgency(asset.urgency),
              alertId: linkedAlertRow?.id ?? null,
              linkedAlert: linkedAlertRow ? {
                id: linkedAlertRow.id,
                type: linkedAlertRow.type,
                location: linkedAlertRow.location,
                severity: linkedAlertRow.severity,
                description: linkedAlertRow.description ?? "",
                probability: linkedAlertRow.probability,
                createdAt: toDisplayDate(linkedAlertRow.createdAt),
              } : null,
              daysUntilDue: asset.days_until,
              isOverdue: asset.days_until < 0,
              estimatedDuration: meta.duration,
              requiredTools: meta.tools,
              technicalNotes: `${asset.recommended_action}. ${meta.notes}`,
              source: "ai",
              sortOrder: index,
            }

            return task
          })
          .filter((item) => !existingKeys.has(normalizeText(`${item.asset}|${item.type}`)))
      : []

    const items = [
      ...aiItems,
      ...dbItems.map((item) => ({ ...item, source: "db", sortOrder: 999 })),
    ].sort((a, b) => {
      const statusRank = (value: string) => value === "Urgent" ? 0 : value === "En cours" ? 1 : value === "Planifie" ? 2 : 3
      const statusDiff = statusRank(String(a.status)) - statusRank(String(b.status))
      if (statusDiff !== 0) return statusDiff
      const dueDiff = String(a.dueDate).localeCompare(String(b.dueDate))
      if (dueDiff !== 0) return dueDiff
      return Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999)
    })

    const pending            = items.filter(t => t.status !== "Termine").length
    const aiPredictions      = fromAI ? aiItems.length : items.filter(t => t.confidence >= 70).length
    const completedThisMonth = Math.max(0, Math.floor(items.length * 0.7))
    const avoidedCost        = items.filter(t =>
      t.status === "Termine" || t.confidence >= 80
    ).length * 4200

    return NextResponse.json({
      stats:        { pending, completedThisMonth, aiPredictions, avoidedCost },
      items,
      ai_available: fromAI,
    })

  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const body = (await request.json()) as {
      alertId?: string
      alertType?: string
      classification?: string
      location?: string
      severity?: string
      probability?: number
      description?: string
      sourceType?: "ai_generated" | "db" | "manual"
      eahFacilityId?: number
      facilityName?: string
      facilityType?: string
      quartier?: string
      facilityStatus?: string
      schoolNearby?: boolean
      genderAccessible?: boolean
    }

    const db = await getDb()
    const isEahRequest = Boolean(body.eahFacilityId)

    if (!isEahRequest && (!body.alertId || !body.alertType || !body.location || !body.severity)) {
      return NextResponse.json({ error: "Alerte incomplète" }, { status: 400 })
    }

    if (isEahRequest && (!body.facilityName || !body.facilityType || !body.quartier || !body.facilityStatus)) {
      return NextResponse.json({ error: "Site EAH incomplet" }, { status: 400 })
    }

    if (isEahRequest) {
      const eahFacilityId = Number(body.eahFacilityId)
      const facilityName = String(body.facilityName)
      const facilityType = String(body.facilityType)
      const quartier = String(body.quartier)
      const facilityStatus = String(body.facilityStatus)

      const existing = db.prepare(
        "SELECT id FROM maintenance_tasks WHERE eah_facility_id = ? AND status <> 'Termine' LIMIT 1"
      ).get(eahFacilityId) as { id: string } | undefined

      if (existing) {
        return NextResponse.json({
          ok: true,
          alreadyExists: true,
          taskId: existing.id,
        })
      }

      const task = buildTaskFromEahFacility({
        id: eahFacilityId,
        name: facilityName,
        type: facilityType,
        quartier,
        status: facilityStatus,
        schoolNearby: body.schoolNearby,
        genderAccessible: body.genderAccessible,
      })

      const count = db.prepare("SELECT COUNT(*) as count FROM maintenance_tasks").get() as { count: number }
      const taskId = `MT-${String(count.count + 1).padStart(3, "0")}`

      db.prepare(`
        INSERT INTO maintenance_tasks (
          id, asset, type, priority, due_date, confidence, status, alert_id, eah_facility_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        taskId,
        task.asset,
        task.type,
        task.priority,
        task.dueDate,
        task.confidence,
        task.status,
        null,
        eahFacilityId,
        new Date().toISOString(),
      )

      return NextResponse.json({ ok: true, taskId, alreadyExists: false, source: "eah" })
    }

    const alertId = String(body.alertId)
    const alertType = String(body.alertType)
    const location = String(body.location)
    const severity = String(body.severity)

    const existingAlert = db.prepare(
      "SELECT id FROM alerts WHERE id = ? LIMIT 1"
    ).get(alertId) as { id: string } | undefined

    if (!existingAlert) {
      db.prepare(`
        INSERT INTO alerts (
          id, type, classification, location, severity, probability, status, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        alertId,
        alertType,
        body.classification ?? alertType,
        location,
        severity,
        Math.max(0, Math.min(100, Math.round(body.probability ?? 60))),
        body.sourceType === "ai_generated" ? "En cours" : "Planifie",
        body.description ?? null,
        new Date().toISOString(),
      )
    }

    const existing = db.prepare(
      "SELECT id FROM maintenance_tasks WHERE alert_id = ? LIMIT 1"
    ).get(alertId) as { id: string } | undefined

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        taskId: existing.id,
      })
    }

    const task = buildTaskFromAlert({
      id: alertId,
      type: alertType,
      location,
      severity,
      probability: body.probability ?? 60,
    })

    const count = db.prepare("SELECT COUNT(*) as count FROM maintenance_tasks").get() as { count: number }
    const taskId = `MT-${String(count.count + 1).padStart(3, "0")}`

    db.prepare(`
      INSERT INTO maintenance_tasks (id, asset, type, priority, due_date, confidence, status, alert_id, eah_facility_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      task.asset,
      task.type,
      task.priority,
      task.dueDate,
      task.confidence,
      task.status,
      alertId,
      null,
      new Date().toISOString(),
    )

    return NextResponse.json({ ok: true, taskId, alreadyExists: false })
  } catch (error) {
    return authErrorResponse(error)
  }
}

// Mise à jour du statut d'une tâche
export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request, ["operateur", "admin"])
    const { id, status } = (await request.json()) as { id?: string; status?: string }

    const allowed = ["Planifie", "En cours", "Termine", "Urgent"]
    if (!id || !status || !allowed.includes(status)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    const db = await getDb()
    if (status === "Planifie") {
      db.prepare(
        "UPDATE maintenance_tasks SET status = ?, assigned_operator_id = NULL, assigned_operator_name = NULL, assigned_at = NULL WHERE id = ?"
      ).run(status, id)
    } else {
      db.prepare(
        `UPDATE maintenance_tasks
         SET status = ?,
             assigned_operator_id = COALESCE(assigned_operator_id, ?),
             assigned_operator_name = COALESCE(assigned_operator_name, ?),
             assigned_at = COALESCE(assigned_at, ?)
         WHERE id = ?`
      ).run(status, user.id, user.name, new Date().toISOString(), id)
    }

    if (status === "Termine") {
      const linkedEah = db.prepare(`
        SELECT eah_facility_id as eahFacilityId
        FROM maintenance_tasks
        WHERE id = ?
        LIMIT 1
      `).get(id) as { eahFacilityId?: number | null } | undefined

      if (linkedEah?.eahFacilityId) {
        db.prepare(`
          UPDATE eah_facilities
          SET status = 'operationnel',
              last_inspection = ?,
              updated_at = ?,
              notes = COALESCE(notes, 'Remis en service') || ' | Intervention clôturée'
          WHERE id = ?
        `).run(new Date().toISOString(), new Date().toISOString(), linkedEah.eahFacilityId)
      }
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    return authErrorResponse(error)
  }
}
