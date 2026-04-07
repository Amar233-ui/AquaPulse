import "server-only"

import { getDb } from "@/lib/server/db"
import { toDisplayDate } from "@/lib/server/time"
import type {
  AIAnomaliesResponse,
  AIAnomaly,
  AIKPIs,
  AIMaintenanceAsset,
  AIQuality,
} from "@/lib/server/ai-client"

const LOCAL_MODEL_VERSION = "aquapulse-local-ai@1.0"

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function severityRank(severity: string) {
  if (severity === "critique") return 0
  if (severity === "alerte") return 1
  if (severity === "moyen") return 2
  return 3
}

async function listActiveAlerts(limit = 50): Promise<Array<{
  id: string
  type: string
  classification: string
  location: string
  severity: "critique" | "alerte" | "moyen" | "faible"
  probability: number
  status: string
  description: string | null
  createdAt: string
}>> {
  const db = await getDb()
  const rows = db.prepare(`
    SELECT id, type, classification, location, severity, probability, status, description, created_at as createdAt
    FROM alerts
    WHERE status NOT IN ('Résolu', 'Fermé', 'Termine')
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `).all(limit) as Array<{
    id: string
    type: string
    classification: string
    location: string
    severity: "critique" | "alerte" | "moyen" | "faible"
    probability: number
    status: string
    description: string | null
    createdAt: string
  }>

  return rows
}

export async function getLocalAnomalies(): Promise<AIAnomaliesResponse> {
  const rows = await listActiveAlerts(60)

  const alerts: AIAnomaly[] = rows.map((row) => ({
    id: row.id,
    type: row.type,
    classification: row.classification,
    location: row.location,
    severity: row.severity,
    probability: clamp(Math.round(row.probability), 0, 100),
    status: row.status,
    description: row.description ?? "",
    source: "local_db",
    date: toDisplayDate(row.createdAt),
    source_type: "ai_generated",
  }))

  const summary = {
    total: alerts.length,
    critique: alerts.filter((a) => a.severity === "critique").length,
    alerte: alerts.filter((a) => a.severity === "alerte").length,
    moyen: alerts.filter((a) => a.severity === "moyen").length,
    faible: alerts.filter((a) => a.severity === "faible").length,
  }

  return {
    alerts,
    summary,
    generated_at: new Date().toISOString(),
    model_version: LOCAL_MODEL_VERSION,
  }
}

export async function getLocalKPIs(): Promise<AIKPIs> {
  const db = await getDb()

  const activeAlertsRow = db.prepare(`
    SELECT COUNT(*) as value
    FROM alerts
    WHERE status NOT IN ('Résolu', 'Fermé', 'Termine')
  `).get() as { value: number }

  const criticalAlertsRow = db.prepare(`
    SELECT COUNT(*) as value
    FROM alerts
    WHERE severity = 'critique'
      AND status NOT IN ('Résolu', 'Fermé', 'Termine')
  `).get() as { value: number }

  const leakRow = db.prepare(`
    SELECT COUNT(*) as value
    FROM alerts
    WHERE classification = 'Fuite'
      AND status NOT IN ('Résolu', 'Fermé', 'Termine')
  `).get() as { value: number }

  const networkHealthRow = db.prepare("SELECT ROUND(AVG(health), 0) as value FROM sectors").get() as { value: number | null }

  const urgentMaintenanceRow = db.prepare(`
    SELECT COUNT(*) as value
    FROM maintenance_tasks
    WHERE status = 'Urgent'
  `).get() as { value: number }

  const { score: qualityScore, trend } = await computeQualityKpis()

  const leakDetections = Number(leakRow.value ?? 0)
  const activeAlerts = Number(activeAlertsRow.value ?? 0)
  const criticalAlerts = Number(criticalAlertsRow.value ?? 0)
  const networkHealth = Number(networkHealthRow.value ?? 0)
  const maintenanceUrgent = Number(urgentMaintenanceRow.value ?? 0)

  // Heuristique simple : plus il y a de fuites actives + alertes,
  // plus on projette des fuites potentielles sur 24h.
  const predictedLeaks24h = clamp(Math.round(leakDetections * 1.3 + Math.min(5, activeAlerts * 0.05)), 0, 999)

  return {
    leakDetections,
    activeAlerts,
    criticalAlerts,
    networkHealth,
    predictedLeaks24h,
    maintenanceUrgent,
    qualityScore,
    qualityTrend: trend,
  }
}

type QualityKpis = { score: number; trend: "stable" | "degrading" | "improving" }

async function computeQualityKpis(): Promise<QualityKpis> {
  const db = await getDb()
  const rows = db.prepare(`
    SELECT metric, value, recorded_at as recordedAt
    FROM quality_readings
    ORDER BY datetime(recorded_at) DESC
    LIMIT 200
  `).all() as Array<{ metric: string; value: number; recordedAt: string }>

  const latest = new Map<string, number>()
  const history: Record<string, number[]> = {}

  for (const row of rows) {
    const metric = String(row.metric)
    if (!history[metric]) history[metric] = []
    history[metric].push(Number(row.value))
    if (!latest.has(metric)) {
      latest.set(metric, Number(row.value))
    }
  }

  const ph = latest.get("ph") ?? 7.2
  const turbidity = latest.get("turbidity") ?? 0.8
  const chlorine = latest.get("chlorine") ?? 0.5
  const temperature = latest.get("temperature") ?? 27
  const coliform = latest.get("coliform") ?? 0

  const scoreNow = qualityScoreFromMetrics({ ph, turbidity, chlorine, temperature, coliform })

  // trend : comparer moyennes des 3 derniers points vs 3 précédents (si dispo)
  const scoreSeries = buildQualityScoreSeries(history)
  const recent = scoreSeries.slice(0, 3)
  const previous = scoreSeries.slice(3, 6)
  const avg = (items: number[]) => items.reduce((s, n) => s + n, 0) / Math.max(1, items.length)
  const delta = avg(recent) - avg(previous)

  const trend: QualityKpis["trend"] =
    Math.abs(delta) < 2 ? "stable"
    : delta > 0 ? "improving"
    : "degrading"

  return { score: scoreNow, trend }
}

function buildQualityScoreSeries(history: Record<string, number[]>) {
  // Les séries dans `history` sont déjà en ordre (desc), on calcule un score point-à-point.
  const len = Math.max(
    history.ph?.length ?? 0,
    history.turbidity?.length ?? 0,
    history.chlorine?.length ?? 0,
    history.temperature?.length ?? 0,
    history.coliform?.length ?? 0,
  )
  const series: number[] = []
  for (let idx = 0; idx < Math.min(len, 12); idx += 1) {
    series.push(qualityScoreFromMetrics({
      ph: history.ph?.[idx] ?? 7.2,
      turbidity: history.turbidity?.[idx] ?? 0.8,
      chlorine: history.chlorine?.[idx] ?? 0.5,
      temperature: history.temperature?.[idx] ?? 27,
      coliform: history.coliform?.[idx] ?? 0,
    }))
  }
  return series
}

function qualityScoreFromMetrics(input: { ph: number; turbidity: number; chlorine: number; temperature: number; coliform: number }) {
  // Score simple (0-100) basé sur des normes usuelles.
  let score = 100

  // pH: 6.5 - 8.5 (idéal ~7.2)
  const phPenalty = clamp(Math.abs(input.ph - 7.2) * 18, 0, 40)
  score -= phPenalty

  // Turbidité: <= 1.0 NTU (au-delà pénalise vite)
  if (input.turbidity > 1.0) score -= clamp((input.turbidity - 1.0) * 25, 0, 45)

  // Chlore: 0.2 - 0.8 mg/L (en dehors pénalise)
  if (input.chlorine < 0.2) score -= clamp((0.2 - input.chlorine) * 60, 0, 30)
  if (input.chlorine > 0.8) score -= clamp((input.chlorine - 0.8) * 60, 0, 30)

  // Température: au-dessus de 30°C pénalise modérément
  if (input.temperature > 30) score -= clamp((input.temperature - 30) * 4, 0, 15)

  // Coliform: présence -> pénalité forte
  if (input.coliform > 0) score -= 35

  return clamp(Math.round(score), 0, 100)
}

export async function getLocalQuality(): Promise<AIQuality> {
  const db = await getDb()
  const rows = db.prepare(`
    SELECT metric, value, recorded_at as recordedAt
    FROM quality_readings
    ORDER BY datetime(recorded_at) DESC
    LIMIT 200
  `).all() as Array<{ metric: string; value: number; recordedAt: string }>

  const latest = new Map<string, number>()
  for (const row of rows) {
    if (!latest.has(row.metric)) latest.set(row.metric, Number(row.value))
  }

  const current = {
    ph: latest.get("ph") ?? 7.2,
    turbidity: latest.get("turbidity") ?? 0.8,
    chlorine: latest.get("chlorine") ?? 0.5,
    temperature: latest.get("temperature") ?? 27,
  }

  const { score: current_score, trend: trend_24h } = await computeQualityKpis()

  return {
    current_score,
    trend_24h,
    current,
    forecast_6h: { ph: current.ph, turbidity: current.turbidity },
    forecast_24h: { ph: current.ph },
    alerts: [],
  }
}

export async function getLocalMaintenance(): Promise<{ assets: AIMaintenanceAsset[] }> {
  const db = await getDb()

  const rows = db.prepare(`
    SELECT
      s.id as sensorId,
      s.name as sensorName,
      s.location as location,
      ah.temperature_c as temperatureC,
      ah.vibration_score as vibrationScore,
      ah.runtime_hours as runtimeHours,
      ah.load_pct as loadPct,
      ah.acoustic_score as acousticScore,
      ah.pressure_delta as pressureDelta,
      ah.flow_delta as flowDelta,
      ah.failure_within_30d as failureWithin30d,
      ah.recorded_at as recordedAt
    FROM sensors s
    JOIN asset_health_snapshots ah
      ON ah.sensor_id = s.id
     AND ah.recorded_at = (
       SELECT MAX(recorded_at) FROM asset_health_snapshots WHERE sensor_id = s.id
     )
    ORDER BY datetime(ah.recorded_at) DESC
    LIMIT 40
  `).all() as Array<{
    sensorId: string
    sensorName: string
    location: string
    temperatureC: number
    vibrationScore: number
    runtimeHours: number
    loadPct: number
    acousticScore: number
    pressureDelta: number
    flowDelta: number
    failureWithin30d: number
    recordedAt: string
  }>

  const assets = rows
    .map((row) => {
      const risk = computeMaintenanceRisk(row)
      const risk_percent = clamp(Math.round(risk * 100), 0, 100)
      const urgency: "urgent" | "planifier" | "surveiller" =
        risk >= 0.8 ? "urgent"
        : risk >= 0.6 ? "planifier"
        : "surveiller"

      const recommended_action = recommendedActionFromSnapshot(row)
      const days_until =
        urgency === "urgent" ? 2
        : urgency === "planifier" ? 7
        : 21
      const due_date = new Date(Date.now() + days_until * 86400000).toISOString().slice(0, 10)

      // asset_name: inclure une localisation lisible pour le matching côté maintenance route.
      const asset_name = `${row.sensorName} — ${row.location}`

      return {
        asset_id: row.sensorId,
        asset_name,
        risk_score: Number((risk * 10).toFixed(1)),
        risk_percent,
        urgency,
        recommended_action,
        due_date,
        days_until,
        ai_confidence: clamp(55 + Math.round(risk_percent * 0.4), 55, 95),
      } satisfies AIMaintenanceAsset
    })
    .sort((a, b) => b.risk_percent - a.risk_percent)

  return { assets }
}

function computeMaintenanceRisk(snapshot: {
  temperatureC: number
  vibrationScore: number
  loadPct: number
  acousticScore: number
  pressureDelta: number
  flowDelta: number
  failureWithin30d: number
}) {
  let risk = 0.25
  if (snapshot.failureWithin30d === 1) risk += 0.45
  risk += clamp((snapshot.temperatureC - 50) / 30, 0, 0.2)
  risk += clamp((snapshot.vibrationScore - 0.55) / 0.6, 0, 0.2)
  risk += clamp((snapshot.acousticScore - 0.18) / 0.35, 0, 0.15)
  risk += clamp(Math.abs(snapshot.pressureDelta) / 2.5, 0, 0.15)
  risk += clamp(Math.abs(snapshot.flowDelta) / 250, 0, 0.1)
  risk += clamp((snapshot.loadPct - 75) / 40, 0, 0.1)
  return clamp(risk, 0, 0.99)
}

function recommendedActionFromSnapshot(snapshot: {
  temperatureC: number
  vibrationScore: number
  acousticScore: number
  pressureDelta: number
  flowDelta: number
  failureWithin30d: number
}) {
  if (snapshot.failureWithin30d === 1) {
    return "Inspection immédiate (risque élevé) — prioriser remplacement pièces critiques"
  }
  if (snapshot.temperatureC >= 60 || snapshot.vibrationScore >= 0.8) {
    return "Inspection vibratoire et thermique — vérifier paliers et alignement"
  }
  if (snapshot.acousticScore >= 0.28) {
    return "Inspection acoustique — suspicion fuite locale, vérifier joints et clapets"
  }
  if (Math.abs(snapshot.pressureDelta) >= 1.2) {
    return "Calibration pression — vérifier capteur / vanne, contrôler pertes de charge"
  }
  if (Math.abs(snapshot.flowDelta) >= 160) {
    return "Inspection débit — vérifier obstruction/fuite et recalibrer capteur"
  }
  return "Inspection préventive — contrôle standard terrain"
}

export async function correlateIncidentLocal(input: {
  id: number
  type: string
  location: string
  description: string
  createdAt?: string
}): Promise<{
  incidentId: number
  correlations: Array<{
    alertId: string
    alertType: string
    location: string
    severity: string
    confidence: number
    reasons: string[]
    status: string
    date: string
    source: "ai" | "db"
  }>
  hasCorrelation: boolean
  analyzed: number
}> {
  const inc_type = normalizeText(input.type ?? "").trim()
  const inc_location = normalizeText(input.location ?? "").trim()
  const inc_desc = normalizeText(input.description ?? "").trim()

  const rows = await listActiveAlerts(80)
  const analyzed = rows.length

  const TYPE_MAP: Record<string, string[]> = {
    fuite: ["fuite", "debit anormal", "pression"],
    pression: ["pression", "fuite", "panne pompe"],
    qualite: ["contamination", "qualite", "ph"],
    contamination: ["contamination", "qualite", "ph"],
    coupure: ["panne pompe", "pression", "fuite"],
    odeur: ["contamination", "qualite"],
    autre: ["debit anormal", "fuite", "pression"],
  }

  const location_words = inc_location.split(/\s+/).filter((w) => w.length > 3)
  const desc_words = inc_desc.split(/\s+/).slice(0, 10).filter((w) => w.length > 4)

  const correlations = rows
    .map((alert) => {
      const alert_type = normalizeText(alert.type)
      const alert_location = normalizeText(alert.location)
      const alert_desc = normalizeText(alert.description ?? "")

      let score = 0
      const reasons: string[] = []

      // Score type (0.0 - 0.50)
      for (const rt of TYPE_MAP[inc_type] ?? [inc_type]) {
        if (!rt) continue
        if (alert_type.includes(rt)) {
          score += 0.5
          reasons.push(`Même type de problème (${alert.type})`)
          break
        }
        const incParts = inc_type.split(/[_\s-]+/).filter(Boolean)
        if (incParts.some((part) => part.length > 3 && alert_type.includes(part))) {
          score += 0.25
          reasons.push(`Type similaire (${alert.type})`)
          break
        }
      }

      // Score localisation (0.0 - 0.35)
      const loc_hits = location_words.filter((w) => alert_location.includes(w)).length
      if (loc_hits > 0) {
        score += Math.min(0.35, loc_hits * 0.15)
        reasons.push(`Zone géographique proche (${alert.location})`)
      }

      // Score description (0.0 - 0.15)
      const desc_hits = desc_words.filter((w) => alert_desc.includes(w)).length
      if (desc_hits > 0) {
        score += Math.min(0.15, desc_hits * 0.05)
        reasons.push("Description similaire")
      }

      if (score < 0.3) return null

      return {
        alertId: alert.id,
        alertType: alert.type,
        location: alert.location,
        severity: alert.severity,
        confidence: Math.round(Math.min(score, 0.99) * 100),
        reasons,
        status: alert.status,
        date: toDisplayDate(alert.createdAt),
        source: "ai" as const,
      }
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((a, b) => b.confidence - a.confidence || severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 3)

  return {
    incidentId: input.id,
    correlations,
    hasCorrelation: correlations.length > 0,
    analyzed,
  }
}

