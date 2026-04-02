import "server-only"

import type {
  AdminDashboardData,
  AdminUserItem,
  AppSettings,
  CitizenDashboardData,
  CitizenNetworkSector,
  CitizenQualityData,
  MapData,
  MapNode,
  MaintenanceTask,
  NotificationCategory,
  NotificationItem,
  OperatorAlert,
  OperatorDashboardData,
  SensorItem,
  SimulationItem,
  UserRole,
  EahFacility,
  EahFacilityType,
  EahFacilityStatus,
  EahZoneStat,
  EahDashboardData,
  BadgeCode,
  CitizenPointsProfile,
  GlobalLeaderboard,
  QuartierLeaderboard,
} from "@/lib/types"
import { getDb } from "@/lib/server/db"
import {
  createStoredUser,
  findStoredUserByEmail,
  findStoredUserById,
  listStoredUsers,
  setStoredUserActive,
  type StoredUserRow,
} from "@/lib/server/user-store"
import { formatRelativeTime, hourLabel, toDisplayDate, weekDayLabel } from "@/lib/server/time"

type UserRow = StoredUserRow

interface LatestMetricRow {
  metric: string
  value: number
  unit: string
  recordedAt: string
}

function toFixedString(value: number, digits = 1): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "0"
}

function roleToLabel(role: UserRole): "Citoyen" | "Operateur" | "Administrateur" {
  if (role === "admin") {
    return "Administrateur"
  }

  if (role === "operateur") {
    return "Operateur"
  }

  return "Citoyen"
}

function initialsFromName(name: string): string {
  const tokens = name
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return "NA"
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase()
  }

  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase()
}

async function getNotificationLastSeen(userId: number, categories: NotificationCategory[]): Promise<Map<NotificationCategory, string>> {
  const db = await getDb()
  const placeholders = categories.map(() => "?").join(", ")
  const rows = db
    .prepare(
      `SELECT category, last_seen_at as lastSeenAt
       FROM notification_reads
       WHERE user_id = ? AND category IN (${placeholders})`,
    )
    .all(userId, ...categories) as Array<{ category: NotificationCategory; lastSeenAt: string }>

  return new Map(rows.map((row) => [row.category, row.lastSeenAt]))
}

function isUnread(createdAt: string, lastSeenAt?: string): boolean {
  if (!lastSeenAt) {
    return true
  }

  return new Date(createdAt).getTime() > new Date(lastSeenAt).getTime()
}

async function getLatestMetrics(): Promise<Record<string, LatestMetricRow>> {
  const db = await getDb()

  const rows = db
    .prepare(
      `SELECT metric, value, unit, recorded_at as recordedAt
       FROM quality_readings
       WHERE id IN (
         SELECT MAX(id)
         FROM quality_readings
         GROUP BY metric
       )`,
    )
    .all() as unknown as LatestMetricRow[]

  return rows.reduce<Record<string, LatestMetricRow>>((accumulator, row) => {
    accumulator[row.metric] = row
    return accumulator
  }, {})
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return findStoredUserByEmail(email)
}

export async function createUser(input: {
  name: string
  email: string
  role: UserRole
  passwordHash: string
}): Promise<{ id: number; name: string; email: string; role: UserRole }> {
  const row = await createStoredUser({
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash: input.passwordHash,
  })

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  }
}

export async function getCitizenDashboardData(quartier?: string): Promise<CitizenDashboardData> {
  const db = await getDb()

  const networkHealthRow = db.prepare("SELECT ROUND(AVG(health), 1) as value FROM sectors").get() as { value: number }
  const pressureRow = db.prepare("SELECT ROUND(AVG(pressure), 2) as value FROM sectors").get() as { value: number }
  const totalSensorsRow = db.prepare("SELECT COUNT(*) as value FROM sensors").get() as { value: number }
  const activeSensorsRow = db.prepare("SELECT COUNT(*) as value FROM sensors WHERE status <> 'inactif'").get() as { value: number }
  const activeAlertsRow = db
    .prepare("SELECT COUNT(*) as value FROM alerts WHERE severity IN ('critique', 'alerte')")
    .get() as { value: number }

  const recentAlertsRows = db
    .prepare(
      `SELECT id, type, location, severity, created_at as createdAt
       FROM alerts
       ORDER BY datetime(created_at) DESC
       LIMIT 5`,
    )
    .all() as Array<{
    id: string
    type: string
    location: string
    severity: "critique" | "alerte" | "moyen" | "faible"
    createdAt: string
  }>

  // Données qualité : par quartier si fourni (table quartier_quality), sinon métriques globales
  let latestPh: number
  let latestTurbidity: number
  let latestChlorine: number
  let latestTemperature: number
  let latestColiform: number

  // Tente de lire les données spécifiques au quartier.
  // Wrapped en try/catch : si la table quartier_quality n'existe pas encore, on retombe sur les métriques globales.
  let quartierLoaded = false
  if (quartier) {
    try {
      const qRow = db
        .prepare("SELECT ph, turbidity, chlorine, temperature, coliforms FROM quartier_quality WHERE quartier = ? LIMIT 1")
        .get(quartier) as { ph: number; turbidity: number; chlorine: number; temperature: number; coliforms: number } | undefined

      if (qRow) {
        latestPh          = qRow.ph
        latestTurbidity   = qRow.turbidity
        latestChlorine    = qRow.chlorine
        latestTemperature = qRow.temperature
        latestColiform    = qRow.coliforms
        quartierLoaded    = true
      }
    } catch {
      // table absente ou erreur SQL → fallback global ci-dessous
    }
  }

  if (!quartierLoaded) {
    const metrics = await getLatestMetrics()
    latestPh          = metrics.ph?.value          ?? 7.2
    latestTurbidity   = metrics.turbidity?.value   ?? 0.8
    latestChlorine    = metrics.chlorine?.value    ?? 0.5
    latestTemperature = metrics.temperature?.value ?? 27.0
    latestColiform    = metrics.coliform?.value    ?? 0
  }

  const networkHealth     = Math.round(networkHealthRow.value ?? 0)
  const pressureRate      = Math.round(Math.min(100, ((pressureRow.value ?? 3) / 3.5) * 100))
  const activeSensorsRate = totalSensorsRow.value > 0 ? Math.round((activeSensorsRow.value / totalSensorsRow.value) * 100) : 0

  const qualityScore = Math.round(
    Math.max(0,
      100
      - latestTurbidity * 12
      - Math.abs(latestPh - 7.2) * 8
      - (latestColiform > 0 ? 15 : 0)
      - (latestChlorine < 0.2 ? 8 : 0)
    )
  )

  return {
    qualityScore,
    temperature: Number(toFixedString(latestTemperature, 1)),
    networkState: activeAlertsRow.value > 4 ? "Sous surveillance" : "Normal",
    activeAlerts: activeAlertsRow.value,
    networkHealth,
    activeSensorsRate,
    pressureRate,
    waterQualityIndicators: [
      {
        label: "pH",
        value: toFixedString(latestPh, 1),
        status: latestPh < 6.5 || latestPh > 8.5 ? "critique" : latestPh < 6.8 ? "alerte" : "normal",
        target: "6.5 - 8.5",
      },
      {
        label: "Turbidité",
        value: `${toFixedString(latestTurbidity, 1)} NTU`,
        status: latestTurbidity > 2 ? "critique" : latestTurbidity > 1 ? "alerte" : "normal",
        target: "< 1 NTU",
      },
      {
        label: "Chlore résiduel",
        value: `${toFixedString(latestChlorine, 2)} mg/L`,
        status: latestChlorine < 0.1 ? "critique" : latestChlorine < 0.2 || latestChlorine > 0.8 ? "alerte" : "normal",
        target: "0.2 - 0.8 mg/L",
      },
      {
        label: "Contamination",
        value: `${toFixedString(latestColiform, 1)} CFU`,
        status: latestColiform > 1 ? "critique" : latestColiform > 0 ? "alerte" : "normal",
        target: "0 CFU/100mL",
      },
    ],
    recentAlerts: recentAlertsRows.map((alert) => ({
      id: alert.id,
      message: `${alert.type} - ${alert.location}`,
      time: formatRelativeTime(alert.createdAt),
      type: alert.severity === "critique" ? "critique" : alert.severity === "alerte" ? "alerte" : "normal",
    })),
  }
}

export async function getCitizenNetworkData(): Promise<CitizenNetworkSector[]> {
  const db = await getDb()

  const rows = db
    .prepare(
      `SELECT sectors.id,
              sectors.name,
              sectors.status,
              sectors.health,
              sectors.pressure,
              COUNT(sensors.id) as sensors
       FROM sectors
       LEFT JOIN sensors ON sensors.sector_id = sectors.id AND sensors.status <> 'inactif'
       GROUP BY sectors.id
       ORDER BY sectors.id ASC`,
    )
    .all() as Array<{
    id: number
    name: string
    status: "normal" | "alerte" | "critique"
    health: number
    pressure: number
    sensors: number
  }>

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    health: row.health,
    sensors: row.sensors,
    pressure: `${toFixedString(row.pressure, 1)} bar`,
  }))
}

export async function getCitizenQualityData(): Promise<CitizenQualityData> {
  const db = await getDb()

  const phRows = db
    .prepare(
      `SELECT value, recorded_at as recordedAt
       FROM quality_readings
       WHERE metric = 'ph'
       ORDER BY datetime(recorded_at) DESC
       LIMIT 7`,
    )
    .all() as Array<{ value: number; recordedAt: string }>

  const turbidityRows = db
    .prepare(
      `SELECT value, recorded_at as recordedAt
       FROM quality_readings
       WHERE metric = 'turbidity'
       ORDER BY datetime(recorded_at) DESC
       LIMIT 7`,
    )
    .all() as Array<{ value: number; recordedAt: string }>

  const metrics = await getLatestMetrics()
  const ph = metrics.ph?.value ?? 7.2
  const turbidity = metrics.turbidity?.value ?? 0.8
  const chlorine = metrics.chlorine?.value ?? 0.5
  const temperature = metrics.temperature?.value ?? 18.5
  const conductivity = metrics.conductivity?.value ?? 420
  const coliform = metrics.coliform?.value ?? 0

  return {
    phData: phRows
      .reverse()
      .map((row) => ({
        time: hourLabel(row.recordedAt),
        value: Number(toFixedString(row.value, 1)),
      })),
    turbidityData: turbidityRows
      .reverse()
      .map((row) => ({
        time: hourLabel(row.recordedAt),
        value: Number(toFixedString(row.value, 1)),
      })),
    parameters: [
      {
        label: "pH",
        value: toFixedString(ph, 1),
        unit: "",
        status: ph < 6.5 || ph > 8.5 ? "alerte" : "normal",
        min: "6.5",
        max: "8.5",
        description: "Le pH mesure l'acidité ou la basicité de l'eau.",
      },
      {
        label: "Turbidité",
        value: toFixedString(turbidity, 1),
        unit: "NTU",
        status: turbidity > 1 ? "alerte" : "normal",
        min: "0",
        max: "1",
        description: "La turbidité mesure la clarte de l'eau.",
      },
      {
        label: "Chlore résiduel",
        value: toFixedString(chlorine, 2),
        unit: "mg/L",
        status: chlorine < 0.2 || chlorine > 0.8 ? "alerte" : "normal",
        min: "0.2",
        max: "0.8",
        description: "Le chlore résiduel assure la désinfection de l'eau.",
      },
      {
        label: "Temperature",
        value: toFixedString(temperature, 1),
        unit: "C",
        status: temperature < 15 || temperature > 30 ? "alerte" : "normal",
        min: "15",
        max: "30",
        description: "La temperature de l'eau distribuee.",
      },
      {
        label: "Conductivite",
        value: toFixedString(conductivity, 0),
        unit: "uS/cm",
        status: conductivity < 200 || conductivity > 800 ? "alerte" : "normal",
        min: "200",
        max: "800",
        description: "La conductivite mesure la minéralisation de l'eau.",
      },
      {
        label: "Coliformes",
        value: toFixedString(coliform, 0),
        unit: "CFU/100mL",
        status: coliform > 0 ? "critique" : "normal",
        min: "0",
        max: "0",
        description: "Absence de bacteries coliformes.",
      },
    ],
  }
}

/** Extrait le quartier depuis la chaîne location (ex: "Fann - Rue Aimé Césaire" → "Fann") */
function extractQuartierFromLocation(location: string): string | undefined {
  const QUARTIERS = ["Plateau","Médina","Fann","HLM","Grand Dakar","Parcelles Assainies","Pikine","Guédiawaye","Rufisque"]
  for (const q of QUARTIERS) {
    if (location.includes(q)) return q
  }
  return undefined
}

export async function createIncident(input: {
  reporterUserId?: number
  type: string
  location: string
  description: string
  reporterName?: string
  reporterEmail?: string
  eahFacilityId?: number | null
}): Promise<{ id: number }> {
  const db = await getDb()

  const result = db
    .prepare(
      `INSERT INTO incidents (
        reporter_user_id,
        type,
        location,
        description,
        reporter_name,
        reporter_email,
        status,
        created_at,
        eah_facility_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'Nouveau', ?, ?)`,
    )
    .run(
      input.reporterUserId ?? null,
      input.type,
      input.location,
      input.description,
      input.reporterName ?? null,
      input.reporterEmail ?? null,
      new Date().toISOString(),
      input.eahFacilityId ?? null,
    )

  const newId = Number(result.lastInsertRowid)

  // Attribuer les points — dans un try/catch pour ne pas bloquer le signalement
  if (input.reporterUserId) {
    try {
      await handleIncidentPointsOnCreate(input.reporterUserId, newId, extractQuartierFromLocation(input.location))
    } catch (e) {
      console.error("[Points] Erreur attribution points création:", e)
    }
  }

  return { id: newId }
}

export async function getMapData(): Promise<MapData> {
  const db = await getDb()
  const nodes = db
    .prepare(
      `SELECT id, x, y, type, label, status, data_json as dataJson
       FROM map_nodes
       ORDER BY id ASC`,
    )
    .all() as Array<{
    id: string
    x: number
    y: number
    type: MapNode["type"]
    label: string
    status: MapNode["status"]
    dataJson: string
  }>

  const links = db
    .prepare(
      `SELECT from_node_id as fromNodeId, to_node_id as toNodeId
       FROM map_connections
       ORDER BY id ASC`,
    )
    .all() as Array<{ fromNodeId: string; toNodeId: string }>

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      type: node.type,
      label: node.label,
      status: node.status,
      data: JSON.parse(node.dataJson) as Record<string, string>,
    })),
    connections: links.map((link) => [link.fromNodeId, link.toNodeId]),
  }
}

export async function getOperatorDashboardData(): Promise<OperatorDashboardData> {
  const db = await getDb()

  const flowRows = db
    .prepare(
      `SELECT metric, value, recorded_at as recordedAt
       FROM flow_readings
       ORDER BY datetime(recorded_at) ASC`,
    )
    .all() as Array<{ metric: "debit" | "pression"; value: number; recordedAt: string }>

  const flowByTime = new Map<string, { debit?: number; pression?: number }>()
  for (const row of flowRows) {
    const time = hourLabel(row.recordedAt)
    const existing = flowByTime.get(time) ?? {}
    existing[row.metric] = row.value
    flowByTime.set(time, existing)
  }

  const flowData = Array.from(flowByTime.entries()).map(([time, values]) => ({
    time,
    debit: Math.round(values.debit ?? 0),
    pression: Number(toFixedString(values.pression ?? 0, 1)),
  }))

  const alertRows = db
    .prepare(
      `SELECT id, type, location, severity, probability, created_at as createdAt
       FROM alerts
       ORDER BY datetime(created_at) DESC
       LIMIT 7`,
    )
    .all() as Array<{
    id: string
    type: string
    location: string
    severity: "critique" | "alerte" | "moyen" | "faible"
    probability: number
    createdAt: string
  }>

  const weekAlertRows = db
    .prepare(
      `SELECT created_at as createdAt
       FROM alerts
       WHERE datetime(created_at) >= datetime('now', '-7 days')`,
    )
    .all() as Array<{ createdAt: string }>

  const countsByDay = new Map<string, number>([
    ["Lun", 0],
    ["Mar", 0],
    ["Mer", 0],
    ["Jeu", 0],
    ["Ven", 0],
    ["Sam", 0],
    ["Dim", 0],
  ])

  for (const row of weekAlertRows) {
    const day = weekDayLabel(row.createdAt)
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1)
  }

  const alertsData = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => ({
    jour: day,
    alertes: countsByDay.get(day) ?? 0,
  }))

  const leakDetections = db
    .prepare("SELECT COUNT(*) as value FROM alerts WHERE classification = 'Fuite'")
    .get() as { value: number }
  const activeAlerts = db
    .prepare("SELECT COUNT(*) as value FROM alerts WHERE severity IN ('critique', 'alerte')")
    .get() as { value: number }
  const criticalAlerts = db
    .prepare("SELECT COUNT(*) as value FROM alerts WHERE severity = 'critique'")
    .get() as { value: number }
  const networkHealth = db.prepare("SELECT ROUND(AVG(health), 1) as value FROM sectors").get() as { value: number }
  const sensorsTotal = db.prepare("SELECT COUNT(*) as value FROM sensors").get() as { value: number }
  const sensorsActive = db
    .prepare("SELECT COUNT(*) as value FROM sensors WHERE status <> 'inactif'")
    .get() as { value: number }

  const byStatus = db
    .prepare("SELECT status, COUNT(*) as count FROM sensors GROUP BY status")
    .all() as Array<{ status: "actif" | "alerte" | "inactif"; count: number }>

  const statusMap = new Map(byStatus.map((item) => [item.status, item.count]))

  const sectorRows = db
    .prepare(
      `SELECT name, pressure, status
       FROM sectors
       ORDER BY pressure ASC, name ASC`,
    )
    .all() as Array<{
      name: string
      pressure: number
      status: "normal" | "alerte" | "critique"
    }>

  const urgentMaintenanceRows = db
    .prepare(
      `SELECT id, asset, status, due_date as dueDate
       FROM maintenance_tasks
       WHERE status IN ('Urgent', 'En cours')
       ORDER BY CASE status WHEN 'Urgent' THEN 0 ELSE 1 END, due_date ASC
       LIMIT 3`,
    )
    .all() as Array<{
      id: string
      asset: string
      status: string
      dueDate: string
    }>

  const newIncidentRows = db
    .prepare(
      `SELECT id, type, location, created_at as createdAt
       FROM incidents
       WHERE status = 'Nouveau'
       ORDER BY datetime(created_at) DESC
       LIMIT 3`,
    )
    .all() as Array<{
      id: number
      type: string
      location: string
      createdAt: string
    }>

  const actionAlertRows = db
    .prepare(
      `SELECT id, type, location, severity, created_at as createdAt
       FROM alerts
       WHERE severity IN ('critique', 'alerte')
       ORDER BY CASE severity WHEN 'critique' THEN 0 ELSE 1 END, datetime(created_at) DESC
       LIMIT 3`,
    )
    .all() as Array<{
      id: string
      type: string
      location: string
      severity: "critique" | "alerte"
      createdAt: string
    }>

  const eahActionRows = db
    .prepare(
      `SELECT id, name, quartier, status, updated_at as updatedAt
       FROM eah_facilities
       WHERE status IN ('hors_service', 'degradé')
       ORDER BY CASE status WHEN 'hors_service' THEN 0 ELSE 1 END, datetime(updated_at) DESC
       LIMIT 3`,
    )
    .all() as Array<{
      id: number
      name: string
      quartier: string
      status: "hors_service" | "degradé"
      updatedAt: string
    }>

  const requiredActions = [
    ...actionAlertRows.map((row) => ({
      id: `alert-${row.id}`,
      type: "alerte" as const,
      label: `${row.type} — ${row.location}`,
      time: formatRelativeTime(row.createdAt),
      urgency: row.severity === "critique" ? "high" as const : "medium" as const,
      href: "/operateur/alertes",
      source: "db" as const,
    })),
    ...newIncidentRows.map((row) => ({
      id: `incident-${row.id}`,
      type: "signalement" as const,
      label: `${row.type} — ${row.location}`,
      time: formatRelativeTime(row.createdAt),
      urgency: "high" as const,
      href: "/operateur/signalements",
      source: "db" as const,
    })),
    ...urgentMaintenanceRows.map((row) => ({
      id: `maintenance-${row.id}`,
      type: "maintenance" as const,
      label: `${row.asset}`,
      time: row.status === "Urgent" ? "immédiat" : `échéance ${row.dueDate}`,
      urgency: row.status === "Urgent" ? "high" as const : "medium" as const,
      href: "/operateur/maintenance",
      source: "hybrid" as const,
    })),
    ...eahActionRows.map((row) => ({
      id: `eah-${row.id}`,
      type: "eah" as const,
      label: `${row.name} — ${row.status === "hors_service" ? "hors service" : "dégradé"}`,
      time: formatRelativeTime(row.updatedAt),
      urgency: row.status === "hors_service" ? "high" as const : "medium" as const,
      href: "/operateur/eah",
      source: "db" as const,
    })),
  ]
    .sort((a, b) => {
      const rank = (urgency: "high" | "medium" | "low") => urgency === "high" ? 0 : urgency === "medium" ? 1 : 2
      return rank(a.urgency) - rank(b.urgency)
    })
    .slice(0, 6)

  const activityFeed = [
    ...alertRows.slice(0, 3).map((row) => ({
      id: `feed-alert-${row.id}`,
      kind: "alerte" as const,
      title: row.type,
      subtitle: `${row.location} • ${row.probability}% de confiance`,
      time: formatRelativeTime(row.createdAt),
      severity: row.severity,
      source: "historique" as const,
      href: "/operateur/alertes",
      ctaLabel: "Voir l'alerte",
    })),
    ...newIncidentRows.slice(0, 2).map((row) => ({
      id: `feed-incident-${row.id}`,
      kind: "signalement" as const,
      title: row.type,
      subtitle: `${row.location} • Nouveau signalement citoyen`,
      time: formatRelativeTime(row.createdAt),
      severity: "alerte" as const,
      source: "terrain" as const,
      href: "/operateur/signalements",
      ctaLabel: "Traiter",
    })),
    ...urgentMaintenanceRows.slice(0, 2).map((row) => ({
      id: `feed-maintenance-${row.id}`,
      kind: "maintenance" as const,
      title: row.asset,
      subtitle: row.status === "Urgent" ? "Intervention immédiate recommandée" : `Suivi en cours • échéance ${row.dueDate}`,
      time: row.status === "Urgent" ? "maintenant" : `pour ${row.dueDate}`,
      severity: row.status === "Urgent" ? "critique" as const : "moyen" as const,
      source: "maintenance" as const,
      href: "/operateur/maintenance",
      ctaLabel: "Ouvrir la tâche",
    })),
    ...eahActionRows.slice(0, 2).map((row) => ({
      id: `feed-eah-${row.id}`,
      kind: "eah" as const,
      title: row.name,
      subtitle: `${row.quartier} • ${row.status === "hors_service" ? "hors service" : "dégradé"}`,
      time: formatRelativeTime(row.updatedAt),
      severity: row.status === "hors_service" ? "critique" as const : "moyen" as const,
      source: "eah" as const,
      href: "/operateur/eah",
      ctaLabel: "Voir le site",
    })),
  ]
    .sort((a, b) => {
      const severityRank = (severity: "critique" | "alerte" | "moyen" | "faible" | "normal") =>
        severity === "critique" ? 0 : severity === "alerte" ? 1 : severity === "moyen" ? 2 : severity === "faible" ? 3 : 4
      return severityRank(a.severity) - severityRank(b.severity)
    })
    .slice(0, 7)

  const systemStatus =
    criticalAlerts.value > 0 || urgentMaintenanceRows.some((row) => row.status === "Urgent")
      ? { label: "Sous tension", tone: "critical" as const }
      : activeAlerts.value > 0 || eahActionRows.length > 0 || newIncidentRows.length > 0
        ? { label: "Interventions requises", tone: "warning" as const }
        : { label: "Réseau stable", tone: "normal" as const }

  return {
    kpis: {
      leakDetections: leakDetections.value,
      activeAlerts: activeAlerts.value,
      criticalAlerts: criticalAlerts.value,
      networkHealth: Number(toFixedString(networkHealth.value ?? 0, 1)),
      activeSensors: sensorsActive.value,
      availabilityRate: sensorsTotal.value > 0 ? Math.round((sensorsActive.value / sensorsTotal.value) * 100) : 0,
    },
    flowData,
    alertsData,
    recentAlerts: alertRows.map((row) => ({
      id: row.id,
      type: row.type,
      location: row.location,
      severity: row.severity,
      probability: `${row.probability}%`,
      time: formatRelativeTime(row.createdAt),
    })),
    sensorStatus: [
      { label: "En ligne", count: statusMap.get("actif") ?? 0, color: "bg-success" },
      { label: "Alerte", count: statusMap.get("alerte") ?? 0, color: "bg-warning" },
      { label: "Hors ligne", count: statusMap.get("inactif") ?? 0, color: "bg-destructive" },
    ],
    zonePressures: sectorRows.map((row) => ({
      zone: row.name,
      pressure: Number(toFixedString(row.pressure, 1)),
      status: row.status,
    })),
    requiredActions,
    activityFeed,
    systemStatus,
  }
}

export async function getOperatorAlerts(filters?: {
  search?: string
  severity?: string
  classification?: string
}): Promise<{
  summary: { critique: number; alerte: number; moyen: number; faible: number }
  items: OperatorAlert[]
}> {
  const db = await getDb()
  const whereClauses: string[] = []
  const params: Array<string | number> = []

  if (filters?.search) {
    whereClauses.push("(type LIKE ? OR location LIKE ? OR id LIKE ?)")
    const searchTerm = `%${filters.search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  if (filters?.severity && filters.severity !== "all") {
    whereClauses.push("severity = ?")
    params.push(filters.severity)
  }

  if (filters?.classification && filters.classification !== "all") {
    whereClauses.push("classification = ?")
    params.push(filters.classification)
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""

  const rows = db
    .prepare(
      `SELECT id, type, classification, location, severity, probability, status,
              description, created_at as createdAt
       FROM alerts
       ${whereSql}
       ORDER BY datetime(created_at) DESC`,
    )
    .all(...params) as Array<{
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

  const summaryRows = db
    .prepare(
      `SELECT severity, COUNT(*) as count
       FROM alerts
       GROUP BY severity`,
    )
    .all() as Array<{ severity: "critique" | "alerte" | "moyen" | "faible"; count: number }>

  const summaryMap = new Map(summaryRows.map((row) => [row.severity, row.count]))

  return {
    summary: {
      critique: summaryMap.get("critique") ?? 0,
      alerte: summaryMap.get("alerte") ?? 0,
      moyen: summaryMap.get("moyen") ?? 0,
      faible: summaryMap.get("faible") ?? 0,
    },
    items: rows.map((row) => ({
      id: row.id,
      type: row.type,
      classification: row.classification,
      location: row.location,
      severity: row.severity,
      probability: `${row.probability}%`,
      date: toDisplayDate(row.createdAt),
      status: row.status,
      description: row.description ?? "",
      source_type: "db",
    })),
  }
}

export async function getMaintenanceTasks(): Promise<{
  stats: {
    pending: number
    completedThisMonth: number
    aiPredictions: number
    avoidedCost: number
  }
  items: MaintenanceTask[]
}> {
  const db = await getDb()

  const rows = db
    .prepare(
      `SELECT id, asset, type, priority, due_date as dueDate, confidence, status
       FROM maintenance_tasks
       ORDER BY due_date ASC`,
    )
    .all() as unknown as MaintenanceTask[]

  const pending = rows.filter((task) => task.status !== "Termine").length
  const aiPredictions = rows.filter((task) => task.confidence >= 70).length
  const completedThisMonth = Math.max(0, Math.floor(rows.length * 0.7))

  return {
    stats: {
      pending,
      completedThisMonth,
      aiPredictions,
      avoidedCost: Math.max(0, Math.floor(rows.filter(t => t.status === "Termine" || t.confidence >= 80).length * 4200)),
    },
    items: rows,
  }
}

export async function getSensors(search?: string): Promise<{
  stats: {
    online: number
    lowBattery: number
    offline: number
  }
  items: SensorItem[]
}> {
  const db = await getDb()
  const whereClauses: string[] = []
  const params: Array<string | number> = []

  if (search) {
    whereClauses.push("(sensors.id LIKE ? OR sensors.location LIKE ? OR sensors.type LIKE ? OR sensors.name LIKE ?)")
    const term = `%${search}%`
    params.push(term, term, term, term)
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""

  const rows = db
    .prepare(
      `SELECT sensors.id,
              sensors.name,
              sensors.type,
              sensors.location,
              sensors.status,
              sensors.battery,
              sensors.signal,
              sensors.last_update as lastUpdate,
              sensors.model,
              sensors.firmware,
              sensors.enabled,
              sectors.name as sector
       FROM sensors
       LEFT JOIN sectors ON sectors.id = sensors.sector_id
       ${whereSql}
       ORDER BY sensors.id ASC`,
    )
    .all(...params) as Array<{
    id: string
    name: string
    type: string
    location: string
    status: "actif" | "alerte" | "inactif"
    battery: number
    signal: number
    lastUpdate: string
    model: string
    firmware: string
    enabled: number
    sector: string | null
  }>

  const allStats = db
    .prepare("SELECT status, COUNT(*) as count FROM sensors GROUP BY status")
    .all() as Array<{ status: "actif" | "alerte" | "inactif"; count: number }>

  const statusMap = new Map(allStats.map((item) => [item.status, item.count]))
  const lowBatteryRow = db.prepare("SELECT COUNT(*) as count FROM sensors WHERE battery > 0 AND battery < 25").get() as { count: number }

  return {
    stats: {
      online: statusMap.get("actif") ?? 0,
      lowBattery: lowBatteryRow.count,
      offline: statusMap.get("inactif") ?? 0,
    },
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      location: row.location,
      status: row.status,
      battery: row.battery,
      signal: row.signal,
      lastUpdate: formatRelativeTime(row.lastUpdate),
      model: row.model,
      firmware: row.firmware,
      sector: row.sector ?? "-",
      enabled: row.enabled === 1,
    })),
  }
}

async function nextSimulationId(): Promise<string> {
  const db = await getDb()
  const row = db.prepare("SELECT COUNT(*) as count FROM simulations").get() as { count: number }
  return `SIM-${(row.count + 1).toString().padStart(3, "0")}`
}

function computeRiskLabel(avgStress: number): "Élevé" | "Moyen" | "Faible" {
  if (avgStress >= 35) {
    return "Élevé"
  }

  if (avgStress >= 15) {
    return "Moyen"
  }

  return "Faible"
}

export async function runSimulation(input: {
  name?: string
  scenario: string
  drought: number
  population: number
  duration: "24h" | "7j" | "30j" | "1a"
  createdBy: number
}): Promise<{
  simulation: SimulationItem
  points: Array<{ hour: string; demand: number; supply: number; stress: number }>
  metrics: {
    averageStress: number
    peaks: number
    reservoirCapacity: number
  }
}> {
  const db = await getDb()
  const id = await nextSimulationId()

  const baseDemand = [100, 60, 140, 180, 160, 130, 90]
  const baseSupply = [120, 120, 120, 150, 140, 130, 120]
  const labels = ["0h", "4h", "8h", "12h", "16h", "20h", "24h"]

  const droughtFactor = 1 + input.drought / 130
  const populationFactor = 1 + input.population / 110
  const supplyPenalty = Math.max(0.55, 1 - input.drought / 180)

  const points = labels.map((hour, index) => {
    const demand = Math.round(baseDemand[index] * droughtFactor * populationFactor)
    const supply = Math.round(baseSupply[index] * supplyPenalty)
    const stress = Math.max(0, Math.round(((demand - supply) / Math.max(supply, 1)) * 100))

    return { hour, demand, supply, stress }
  })

  const averageStress = Math.round(points.reduce((total, point) => total + point.stress, 0) / points.length)
  const peaks = points.filter((point) => point.stress >= 30).length
  const reservoirCapacity = Math.max(20, Math.round(88 - input.drought * 0.45 - input.population * 0.25))
  const risk = computeRiskLabel(averageStress)
  const simulationName =
    input.name && input.name.trim() !== "" ? input.name.trim() : `Scenario ${input.scenario} ${new Date().toISOString().slice(0, 10)}`

  db.prepare(
    `INSERT INTO simulations (
      id, name, scenario, status, result_risk, duration_hours, parameters_json, results_json, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    simulationName,
    input.scenario,
    "Termine",
    risk,
    input.duration === "24h" ? 24 : input.duration === "7j" ? 168 : input.duration === "30j" ? 720 : 8760,
    JSON.stringify({ drought: input.drought, population: input.population, duration: input.duration }),
    JSON.stringify(points),
    input.createdBy,
    new Date().toISOString(),
  )

  return {
    simulation: {
      id,
      name: simulationName,
      scenario: input.scenario,
      status: "Termine",
      date: new Date().toISOString().slice(0, 10),
      resultRisk: risk,
      duration: input.duration,
    },
    points,
    metrics: {
      averageStress,
      peaks,
      reservoirCapacity,
    },
  }
}

export async function getSimulations(): Promise<{
  stats: {
    total: number
    running: number
    reports: number
  }
  items: SimulationItem[]
}> {
  const db = await getDb()

  const rows = db
    .prepare(
      `SELECT id, name, scenario, status, result_risk as resultRisk, duration_hours as durationHours, created_at as createdAt
       FROM simulations
       ORDER BY datetime(created_at) DESC`,
    )
    .all() as Array<{
    id: string
    name: string
    scenario: string
    status: "Planifie" | "En cours" | "Termine"
    resultRisk: "Élevé" | "Moyen" | "Faible" | "-"
    durationHours: number
    createdAt: string
  }>

  const running = rows.filter((row) => row.status === "En cours").length
  const reports = rows.filter((row) => row.status === "Termine").length

  return {
    stats: {
      total: rows.length,
      running,
      reports,
    },
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      scenario: row.scenario,
      status: row.status,
      date: row.createdAt.slice(0, 10),
      resultRisk: row.resultRisk,
      duration: row.durationHours >= 24 ? `${Math.round(row.durationHours / 24)}j` : `${row.durationHours}h`,
    })),
  }
}

export async function getLatestSimulationRun(): Promise<{
  scenario: string
  duration: "24h" | "7j" | "30j" | "1a"
  points: Array<{ hour: string; demand: number; supply: number; stress: number }>
  metrics: {
    averageStress: number
    peaks: number
    reservoirCapacity: number
  }
}> {
  const db = await getDb()
  const row = db
    .prepare(
      `SELECT scenario, duration_hours as durationHours, parameters_json as parametersJson, results_json as resultsJson
       FROM simulations
       ORDER BY datetime(created_at) DESC
       LIMIT 1`,
    )
    .get() as
    | {
        scenario: string
        durationHours: number
        parametersJson: string
        resultsJson: string
      }
    | undefined

  if (!row) {
    return {
      scenario: "Secheresse",
      duration: "24h",
      points: [
        { hour: "0h", demand: 100, supply: 120, stress: 10 },
        { hour: "4h", demand: 60, supply: 120, stress: 5 },
        { hour: "8h", demand: 140, supply: 120, stress: 25 },
        { hour: "12h", demand: 180, supply: 150, stress: 40 },
        { hour: "16h", demand: 160, supply: 140, stress: 30 },
        { hour: "20h", demand: 130, supply: 130, stress: 15 },
        { hour: "24h", demand: 90, supply: 120, stress: 8 },
      ],
      metrics: {
        averageStress: 19,
        peaks: 3,
        reservoirCapacity: 72,
      },
    }
  }

  const points = JSON.parse(row.resultsJson) as Array<{ hour: string; demand: number; supply: number; stress: number }>
  const averageStress = Math.round(points.reduce((total, point) => total + point.stress, 0) / Math.max(points.length, 1))
  const peaks = points.filter((point) => point.stress >= 30).length
  const parameters = JSON.parse(row.parametersJson) as { drought?: number; population?: number; duration?: string }
  const duration =
    parameters.duration === "7j" || parameters.duration === "30j" || parameters.duration === "1a" ? parameters.duration : "24h"
  const reservoirCapacity = Math.max(
    20,
    Math.round(88 - (parameters.drought ?? 30) * 0.45 - (parameters.population ?? 15) * 0.25),
  )

  return {
    scenario: row.scenario,
    duration,
    points,
    metrics: {
      averageStress,
      peaks,
      reservoirCapacity,
    },
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const db = await getDb()

  const activeUsers = db.prepare("SELECT COUNT(*) as value FROM users WHERE is_active = 1").get() as { value: number }
  const sensors = db.prepare("SELECT COUNT(*) as value FROM sensors").get() as { value: number }
  const processedAlerts = db.prepare("SELECT COUNT(*) as value FROM alerts").get() as { value: number }
  const criticalAlerts = db
    .prepare("SELECT COUNT(*) as value FROM alerts WHERE severity = 'critique'")
    .get() as { value: number }
  const offlineSensors = db
    .prepare("SELECT COUNT(*) as value FROM sensors WHERE status = 'inactif'")
    .get() as { value: number }

  const userActivity = db
    .prepare("SELECT month, users FROM monthly_user_activity ORDER BY id ASC")
    .all() as Array<{ month: string; users: number }>

  const typeRows = db
    .prepare("SELECT type, COUNT(*) as value FROM sensors GROUP BY type")
    .all() as Array<{ type: string; value: number }>

  const colorMap: Record<string, string> = {
    Debit: "oklch(0.45 0.15 240)",
    Pression: "oklch(0.70 0.15 195)",
    Qualite: "oklch(0.55 0.12 220)",
    Temperature: "oklch(0.65 0.10 200)",
    Acoustique: "oklch(0.75 0.08 210)",
  }

  return {
    kpis: {
      activeUsers: activeUsers.value,
      sensors: sensors.value,
      uptime: "99.97%",
      processedAlerts: processedAlerts.value,
    },
    systemMetrics: [
      { name: "CPU", value: Math.min(92, 35 + criticalAlerts.value * 4) },
      { name: "Memoire", value: Math.min(89, 50 + offlineSensors.value) },
      { name: "Stockage", value: Math.min(80, 30 + Math.floor(processedAlerts.value / 8)) },
      { name: "Bande Passante", value: Math.min(85, 28 + Math.floor(processedAlerts.value / 12)) },
    ],
    userActivity,
    sensorDistribution: typeRows.map((row) => ({
      name: row.type,
      value: row.value,
      color: colorMap[row.type] ?? "oklch(0.65 0.03 220)",
    })),
    security: [
      { label: "Certificats SSL", status: "Valide", color: "bg-success" },
      { label: "Authentification 2FA", status: "Activée", color: "bg-success" },
      { label: "Dernière sauvegarde", status: "Il y a 2h", color: "bg-success" },
      { label: "Scan de sécurité", status: "Aucune menace", color: "bg-success" },
      { label: "Tentatives de connexion", status: "12 échouées (24h)", color: "bg-warning" },
    ],
  }
}

export async function getAdminUsers(search?: string): Promise<{
  stats: {
    total: number
    active: number
    operators: number
    new30d: number
  }
  items: AdminUserItem[]
}> {
  const [allRows, rows] = await Promise.all([listStoredUsers(), listStoredUsers(search)])
  const now = Date.now()
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

  const total = allRows.length
  const active = allRows.filter((row) => row.isActive === 1).length
  const operators = allRows.filter((row) => row.role === "operateur" && row.isActive === 1).length
  const new30d = allRows.filter((row) => {
    const createdAt = Date.parse(row.createdAt)
    return Number.isFinite(createdAt) && now - createdAt <= THIRTY_DAYS_MS
  }).length

  return {
    stats: {
      total,
      active,
      operators,
      new30d,
    },
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: roleToLabel(row.role),
      status: row.isActive === 1,
      lastLogin: row.lastLoginAt ? formatRelativeTime(row.lastLoginAt) : "Jamais",
      initials: initialsFromName(row.name),
    })),
  }
}

export async function setUserStatus(userId: number, active: boolean): Promise<void> {
  await setStoredUserActive(userId, active)
}

export async function getAdminDevices(search?: string): Promise<{
  stats: {
    total: number
    online: number
    offline: number
    updateRequired: number
  }
  items: SensorItem[]
}> {
  const sensors = await getSensors(search)

  const updateRequired = sensors.items.filter((item) => {
    const major = Number.parseInt((item.firmware ?? "v0.0.0").replace("v", "").split(".")[0] ?? "0", 10)
    return Number.isFinite(major) && major < 3
  }).length

  return {
    stats: {
      total: sensors.items.length,
      online: sensors.stats.online,
      offline: sensors.stats.offline,
      updateRequired,
    },
    items: sensors.items,
  }
}

export async function setDeviceEnabled(deviceId: string, enabled: boolean): Promise<void> {
  const db = await getDb()

  if (enabled) {
    db.prepare(
      `UPDATE sensors
       SET enabled = 1,
           status = CASE WHEN status = 'inactif' THEN 'actif' ELSE status END,
           last_update = ?
       WHERE id = ?`,
    ).run(new Date().toISOString(), deviceId)
    return
  }

  db.prepare("UPDATE sensors SET enabled = 0, status = 'inactif', last_update = ? WHERE id = ?").run(new Date().toISOString(), deviceId)
}

const DEFAULT_SETTINGS: AppSettings = {
  orgName: "SDE - Senegalaise Des Eaux, Dakar",
  timezone: "africa-dakar",
  apiKey: "aqp_sk_9f2ce1d0bd9f87d2f45f11",
  notifications: {
    criticalEmail: true,
    dailyReport: true,
    predictiveMaintenance: true,
    citizenReports: false,
  },
  security: {
    require2FA: true,
    sessionExpiry: "8h",
    auditLogs: true,
  },
  database: {
    autoBackup: true,
    retentionPeriod: "1y",
  },
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb()
  const row = db
    .prepare(
      `SELECT org_name as orgName,
              timezone,
              api_key as apiKey,
              notifications_json as notificationsJson,
              security_json as securityJson,
              database_json as databaseJson
       FROM settings
       WHERE id = 1`,
    )
    .get() as
    | {
        orgName: string
        timezone: string
        apiKey: string
        notificationsJson: string
        securityJson: string
        databaseJson: string
      }
    | undefined

  if (!row) {
    return DEFAULT_SETTINGS
  }

  return {
    orgName: row.orgName,
    timezone: row.timezone,
    apiKey: row.apiKey,
    notifications: JSON.parse(row.notificationsJson) as AppSettings["notifications"],
    security: JSON.parse(row.securityJson) as AppSettings["security"],
    database: JSON.parse(row.databaseJson) as AppSettings["database"],
  }
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const db = await getDb()
  db.prepare(
    `UPDATE settings
     SET org_name = ?,
         timezone = ?,
         api_key = ?,
         notifications_json = ?,
         security_json = ?,
         database_json = ?,
         updated_at = ?
     WHERE id = 1`,
  ).run(
    settings.orgName,
    settings.timezone,
    settings.apiKey,
    JSON.stringify(settings.notifications),
    JSON.stringify(settings.security),
    JSON.stringify(settings.database),
    new Date().toISOString(),
  )
}

export async function getUserById(id: number): Promise<{ id: number; name: string; email: string; role: UserRole } | null> {
  const row = await findStoredUserById(id)
  if (!row) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  }
}

export async function getUnreadNotifications(user: { id: number; role: UserRole }): Promise<NotificationItem[]> {
  const db = await getDb()

  if (user.role === "operateur") {
    const categories: NotificationCategory[] = ["alertes", "signalements", "maintenance", "eah"]
    const lastSeen = await getNotificationLastSeen(user.id, categories)

    const alertRows = db
      .prepare(
        `SELECT id, type, location, severity, created_at as createdAt
         FROM alerts
         WHERE severity IN ('critique', 'alerte')
           AND status IN ('En cours', 'Analyse', 'Investigation')
         ORDER BY datetime(created_at) DESC
         LIMIT 20`,
      )
      .all() as Array<{ id: string; type: string; location: string; severity: NotificationItem["severity"]; createdAt: string }>

    const incidentRows = db
      .prepare(
        `SELECT id, type, location, created_at as createdAt
         FROM incidents
         WHERE status = 'Nouveau'
         ORDER BY datetime(created_at) DESC
         LIMIT 20`,
      )
      .all() as Array<{ id: number; type: string; location: string; createdAt: string }>

    const maintenanceRows = db
      .prepare(
        `SELECT id, asset, status, created_at as createdAt
         FROM maintenance_tasks
         WHERE status IN ('Urgent', 'En cours')
         ORDER BY datetime(created_at) DESC
         LIMIT 20`,
      )
      .all() as Array<{ id: string; asset: string; status: string; createdAt: string }>

    const eahRows = db
      .prepare(
        `SELECT id, name, quartier, status, updated_at as updatedAt
         FROM eah_facilities
         WHERE status IN ('hors_service', 'degradé')
         ORDER BY datetime(updated_at) DESC
         LIMIT 20`,
      )
      .all() as Array<{ id: number; name: string; quartier: string; status: string; updatedAt: string }>

    const items: NotificationItem[] = [
      ...alertRows
        .filter((row) => isUnread(row.createdAt, lastSeen.get("alertes")))
        .map((row) => ({
          id: `alert-${row.id}`,
          category: "alertes" as const,
          title: row.type,
          description: `${row.location} • alerte opérateur active`,
          href: "/operateur/alertes",
          severity: row.severity,
          createdAt: row.createdAt,
          time: formatRelativeTime(row.createdAt),
        })),
      ...incidentRows
        .filter((row) => isUnread(row.createdAt, lastSeen.get("signalements")))
        .map((row) => ({
          id: `incident-${row.id}`,
          category: "signalements" as const,
          title: row.type,
          description: `${row.location} • nouveau signalement citoyen`,
          href: "/operateur/signalements",
          severity: "alerte" as const,
          createdAt: row.createdAt,
          time: formatRelativeTime(row.createdAt),
        })),
      ...maintenanceRows
        .filter((row) => isUnread(row.createdAt, lastSeen.get("maintenance")))
        .map((row) => ({
          id: `maintenance-${row.id}`,
          category: "maintenance" as const,
          title: row.asset,
          description: row.status === "Urgent" ? "intervention immédiate requise" : "tâche en cours à suivre",
          href: "/operateur/maintenance",
          severity: row.status === "Urgent" ? "critique" as const : "moyen" as const,
          createdAt: row.createdAt,
          time: formatRelativeTime(row.createdAt),
        })),
      ...eahRows
        .filter((row) => isUnread(row.updatedAt, lastSeen.get("eah")))
        .map((row) => ({
          id: `eah-${row.id}`,
          category: "eah" as const,
          title: row.name,
          description: `${row.quartier} • ${row.status === "hors_service" ? "hors service" : "dégradé"}`,
          href: "/operateur/eah",
          severity: row.status === "hors_service" ? "critique" as const : "moyen" as const,
          createdAt: row.updatedAt,
          time: formatRelativeTime(row.updatedAt),
        })),
    ]

    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 25)
  }

  if (user.role === "citoyen") {
    const lastSeen = await getNotificationLastSeen(user.id, ["alertes"])
    const rows = db
      .prepare(
        `SELECT id, type, location, severity, created_at as createdAt
         FROM alerts
         WHERE severity IN ('critique', 'alerte')
         ORDER BY datetime(created_at) DESC
         LIMIT 20`,
      )
      .all() as Array<{ id: string; type: string; location: string; severity: NotificationItem["severity"]; createdAt: string }>

    return rows
      .filter((row) => isUnread(row.createdAt, lastSeen.get("alertes")))
      .map((row) => ({
        id: `alert-${row.id}`,
        category: "alertes" as const,
        title: row.type,
        description: row.location,
        href: "/citoyen",
        severity: row.severity,
        createdAt: row.createdAt,
        time: formatRelativeTime(row.createdAt),
      }))
  }

  return []
}

export async function markNotificationsViewed(userId: number, categories: NotificationCategory[]): Promise<void> {
  if (categories.length === 0) {
    return
  }

  const db = await getDb()
  const now = new Date().toISOString()
  const upsert = db.prepare(`
    INSERT INTO notification_reads (user_id, category, last_seen_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, category)
    DO UPDATE SET last_seen_at = excluded.last_seen_at
  `)

  for (const category of categories) {
    upsert.run(userId, category, now)
  }
}

export async function getNotificationCount(role: UserRole, userId?: number): Promise<number> {
  const db = await getDb()

  if (role === "citoyen") {
    if (userId) {
      const items = await getUnreadNotifications({ id: userId, role })
      return items.length
    }
    const row = db
      .prepare("SELECT COUNT(*) as value FROM alerts WHERE severity IN ('critique', 'alerte') AND datetime(created_at) >= datetime('now', '-24 hours')")
      .get() as { value: number }
    return row.value
  }

  if (role === "operateur") {
    if (userId) {
      const items = await getUnreadNotifications({ id: userId, role })
      return items.length
    }
    const row = db
      .prepare("SELECT COUNT(*) as value FROM alerts WHERE severity IN ('critique', 'alerte') AND status IN ('En cours', 'Analyse', 'Investigation')")
      .get() as { value: number }
    return row.value
  }

  const incidents = db.prepare("SELECT COUNT(*) as value FROM incidents WHERE status = 'Nouveau'").get() as { value: number }
  const users = db.prepare("SELECT COUNT(*) as value FROM users WHERE is_active = 0").get() as { value: number }
  return incidents.value + users.value
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNALEMENTS CITOYENS — fonctions opérateur & citoyen
// ─────────────────────────────────────────────────────────────────────────────

export async function getOperatorIncidents(filters?: {
  search?: string
  status?: string
}): Promise<{
  items: import("@/lib/types").OperatorIncident[]
  summary: import("@/lib/types").IncidentSummary
}> {
  const db = await getDb()
  const whereClauses: string[] = []
  const params: Array<string | number> = []

  if (filters?.search) {
    whereClauses.push("(incidents.type LIKE ? OR incidents.location LIKE ? OR incidents.description LIKE ?)")
    const t = `%${filters.search}%`
    params.push(t, t, t)
  }
  if (filters?.status && filters.status !== "all") {
    whereClauses.push("incidents.status = ?")
    params.push(filters.status)
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""

  const rows = db
    .prepare(
      `SELECT incidents.id as id,
              incidents.reporter_user_id as reporterUserId,
              incidents.type as type,
              incidents.location as location,
              incidents.description as description,
              incidents.reporter_name as reporterName,
              incidents.reporter_email as reporterEmail,
              incidents.status as status,
              incidents.assigned_operator_id as assignedOperatorId,
              incidents.assigned_operator_name as assignedOperatorName,
              incidents.assigned_at as assignedAt,
              incidents.created_at as createdAt,
              incidents.resolved_at as resolvedAt,
              incidents.eah_facility_id as eahFacilityId,
              ef.name as eahFacilityName
       FROM incidents
       LEFT JOIN eah_facilities ef ON ef.id = incidents.eah_facility_id
       ${where}
       ORDER BY CASE incidents.status WHEN 'Nouveau' THEN 0 WHEN 'En cours' THEN 1 WHEN 'Résolu' THEN 2 ELSE 3 END,
                datetime(incidents.created_at) DESC`,
    )
    .all(...params) as Array<{
      id: number; reporterUserId: number | null; type: string; location: string
      description: string; reporterName: string | null; reporterEmail: string | null
      status: string; assignedOperatorId: number | null; assignedOperatorName: string | null; assignedAt: string | null
      createdAt: string; resolvedAt: string | null
      eahFacilityId: number | null; eahFacilityName: string | null
    }>

  const summaryRows = db
    .prepare("SELECT status, COUNT(*) as count FROM incidents GROUP BY status")
    .all() as Array<{ status: string; count: number }>

  const sm = new Map(summaryRows.map(r => [r.status, r.count]))
  const total = summaryRows.reduce((acc, r) => acc + r.count, 0)

  return {
    items: rows.map(r => ({
      id: r.id,
      type: r.type,
      location: r.location,
      description: r.description,
      status: r.status as import("@/lib/types").OperatorIncident["status"],
      createdAt: toDisplayDate(r.createdAt),
      resolvedAt: r.resolvedAt ? toDisplayDate(r.resolvedAt) : null,
      reporterName: r.reporterName,
      reporterEmail: r.reporterEmail,
      reporterUserId: r.reporterUserId,
      eahFacilityId: r.eahFacilityId,
      eahFacilityName: r.eahFacilityName,
      assignedOperatorId: r.assignedOperatorId,
      assignedOperatorName: r.assignedOperatorName,
      assignedAt: r.assignedAt ? toDisplayDate(r.assignedAt) : null,
    })),
    summary: {
      nouveau: sm.get("Nouveau") ?? 0,
      enCours: sm.get("En cours") ?? 0,
      resolu: sm.get("Résolu") ?? 0,
      total,
    },
  }
}

export async function updateIncidentStatus(
  id: number,
  status: "Nouveau" | "En cours" | "Résolu" | "Fermé",
  operator?: { id: number; name: string },
): Promise<void> {
  const db = await getDb()
  const resolvedAt = status === "Résolu" ? new Date().toISOString() : null
  const assignNow = operator && (status === "En cours" || status === "Résolu" || status === "Fermé")

  if (status === "Nouveau") {
    db.prepare(
      "UPDATE incidents SET status = ?, resolved_at = ?, assigned_operator_id = NULL, assigned_operator_name = NULL, assigned_at = NULL WHERE id = ?"
    ).run(status, resolvedAt, id)
    return
  }

  db.prepare(
    `UPDATE incidents
     SET status = ?,
         resolved_at = ?,
         assigned_operator_id = COALESCE(assigned_operator_id, ?),
         assigned_operator_name = COALESCE(assigned_operator_name, ?),
         assigned_at = COALESCE(assigned_at, ?)
     WHERE id = ?`
  ).run(
    status,
    resolvedAt,
    assignNow ? operator.id : null,
    assignNow ? operator.name : null,
    assignNow ? new Date().toISOString() : null,
    id,
  )

  // Attribuer les points de résolution — dans un try/catch pour ne pas bloquer
  if (status === "Résolu") {
    try {
      await handleIncidentPointsOnResolve(id)
    } catch (e) {
      console.error("[Points] Erreur attribution points résolution:", e)
    }
  }
}

export async function getMyIncidents(
  userId: number,
): Promise<import("@/lib/types").CitizenIncident[]> {
  const db = await getDb()
  const rows = db
    .prepare(
      `SELECT id, type, location, description, reporter_name as reporterName,
              status, created_at as createdAt, resolved_at as resolvedAt
       FROM incidents WHERE reporter_user_id = ?
       ORDER BY datetime(created_at) DESC LIMIT 20`,
    )
    .all(userId) as Array<{
      id: number; type: string; location: string; description: string
      reporterName: string | null; status: string; createdAt: string; resolvedAt: string | null
    }>

  return rows.map(r => ({
    id: r.id,
    type: r.type,
    location: r.location,
    description: r.description,
    status: r.status as import("@/lib/types").CitizenIncident["status"],
    createdAt: toDisplayDate(r.createdAt),
    resolvedAt: r.resolvedAt ? toDisplayDate(r.resolvedAt) : null,
    reporterName: r.reporterName,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE EAH — Eau, Assainissement, Hygiène
// ─────────────────────────────────────────────────────────────────────────────

// EAH types imported at top

function rowToFacility(r: Record<string, unknown>): EahFacility {
  return {
    id: r.id as number,
    name: r.name as string,
    type: r.type as EahFacilityType,
    quartier: r.quartier as string,
    address: r.address as string,
    status: r.status as EahFacilityStatus,
    gender_accessible: (r.gender_accessible as number) === 1,
    disabled_accessible: (r.disabled_accessible as number) === 1,
    school_nearby: (r.school_nearby as number) === 1,
    last_inspection: r.last_inspection as string | null,
    notes: r.notes as string | null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    community_signal_count: Number(r.community_signal_count ?? 0),
    community_unique_reporters: Number(r.community_unique_reporters ?? 0),
    community_confirmation: (r.community_confirmation as EahFacility["community_confirmation"]) ?? "none",
    last_community_report_at: r.last_community_report_at as string | null,
  }
}

export async function getEahFacilities(params?: {
  quartier?: string
  status?: string
  type?: string
}): Promise<EahFacility[]> {
  const db = await getDb()
  const where: string[] = []
  const vals: Array<string | number> = []

  if (params?.quartier) { where.push("quartier = ?"); vals.push(params.quartier) }
  if (params?.status)   { where.push("status = ?");   vals.push(params.status) }
  if (params?.type)     { where.push("type = ?");     vals.push(params.type) }

  const scopedWhere = where.length
    ? " WHERE " + where
        .map((clause) =>
          clause.replace(/\bquartier\b/g, "ef.quartier").replace(/\bstatus\b/g, "ef.status").replace(/\btype\b/g, "ef.type"),
        )
        .join(" AND ")
    : ""

  const sql = `
    SELECT
      ef.*,
      COALESCE(cs.community_signal_count, 0) as community_signal_count,
      COALESCE(cs.community_unique_reporters, 0) as community_unique_reporters,
      COALESCE(cs.community_confirmation, 'none') as community_confirmation,
      cs.last_community_report_at as last_community_report_at
    FROM eah_facilities ef
    LEFT JOIN (
      SELECT
        eah_facility_id,
        COUNT(*) as community_signal_count,
        COUNT(DISTINCT COALESCE(NULLIF(reporter_email, ''), NULLIF(reporter_name, ''), CAST(reporter_user_id AS TEXT), 'anonyme')) as community_unique_reporters,
        MAX(created_at) as last_community_report_at,
        CASE
          WHEN COUNT(DISTINCT COALESCE(NULLIF(reporter_email, ''), NULLIF(reporter_name, ''), CAST(reporter_user_id AS TEXT), 'anonyme')) >= 3 THEN 'confirmed'
          WHEN COUNT(DISTINCT COALESCE(NULLIF(reporter_email, ''), NULLIF(reporter_name, ''), CAST(reporter_user_id AS TEXT), 'anonyme')) = 2 THEN 'probable'
          WHEN COUNT(*) >= 1 THEN 'to_verify'
          ELSE 'none'
        END as community_confirmation
      FROM incidents
      WHERE eah_facility_id IS NOT NULL
      GROUP BY eah_facility_id
    ) cs ON cs.eah_facility_id = ef.id
    ${scopedWhere}
    ORDER BY ef.quartier, ef.name
  `
  return (db.prepare(sql).all(...vals) as Record<string, unknown>[]).map(rowToFacility)
}

export async function getEahDashboardData(): Promise<EahDashboardData> {
  const db = await getDb()

  const all = (db.prepare("SELECT * FROM eah_facilities ORDER BY updated_at DESC").all() as Record<string, unknown>[]).map(rowToFacility)

  const stats = {
    total_facilities: all.length,
    operational: all.filter(f => f.status === "operationnel").length,
    degraded: all.filter(f => f.status === "degradé").length,
    out_of_service: all.filter(f => f.status === "hors_service").length,
    gender_accessible: all.filter(f => f.gender_accessible).length,
    schools_covered: all.filter(f => f.school_nearby).length,
  }

  const QUARTIERS = ["Plateau","Médina","Fann","HLM","Grand Dakar","Parcelles Assainies","Pikine","Guédiawaye","Rufisque"]
  const zone_stats: EahZoneStat[] = QUARTIERS.map(q => {
    const qf = all.filter(f => f.quartier === q)
    const total = qf.length
    const operationnel = qf.filter(f => f.status === "operationnel").length
    const hors_service = qf.filter(f => f.status === "hors_service").length
    const score = total === 0 ? 0 : Math.round((operationnel / total) * 100)
    return {
      quartier: q, total, operationnel, hors_service, score,
      has_gender_facility: qf.some(f => f.gender_accessible),
    }
  })

  const recent_reports = all
    .filter(f => f.status !== "operationnel")
    .slice(0, 8)

  return { stats, zone_stats, recent_reports }
}

export async function updateEahFacilityStatus(
  id: number,
  status: EahFacilityStatus,
  notes?: string
): Promise<void> {
  const db = await getDb()
  const now = new Date().toISOString()
  if (notes !== undefined) {
    db.prepare("UPDATE eah_facilities SET status = ?, notes = ?, last_inspection = ?, updated_at = ? WHERE id = ?")
      .run(status, notes, now, now, id)
  } else {
    db.prepare("UPDATE eah_facilities SET status = ?, last_inspection = ?, updated_at = ? WHERE id = ?")
      .run(status, now, now, id)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTÈME DE POINTS & BADGES
// ═══════════════════════════════════════════════════════════════════════════

// Points types imported at top

/** Définition de tous les badges avec leurs seuils */
export const BADGE_DEFINITIONS = [
  {
    code: "premier_pas"  as BadgeCode, label: "Premier Pas",   icon: "🌱",
    description: "Premier signalement soumis",        color: "#22c55e",  threshold: 0,
  },
  {
    code: "vigilant"     as BadgeCode, label: "Vigilant",       icon: "👁️",
    description: "50 points accumulés",               color: "#3b82f6",  threshold: 50,
  },
  {
    code: "expert"       as BadgeCode, label: "Expert",         icon: "🎯",
    description: "150 points – signalements fiables", color: "#8b5cf6",  threshold: 150,
  },
  {
    code: "champion"     as BadgeCode, label: "Champion",       icon: "🏆",
    description: "300 points – pilier de la communauté", color: "#f59e0b", threshold: 300,
  },
  {
    code: "sentinelle"   as BadgeCode, label: "Sentinelle",     icon: "🛡️",
    description: "500 points – gardien du réseau",    color: "#06b6d4",  threshold: 500,
  },
  {
    code: "ambassadeur"  as BadgeCode, label: "Ambassadeur",    icon: "🌟",
    description: "1000 points – légende AquaPulse",   color: "#ec4899",  threshold: 1000,
  },
]

/** Raison → libellé lisible + points associés */
export const POINTS_REASONS: Record<string, { label: string; points: number }> = {
  premier_signalement:   { label: "1er signalement 🌟",            points: 10 },
  signalement_soumis:    { label: "Signalement soumis",            points: 5  },
  signalement_confirme:  { label: "Signalement confirmé (IA)",     points: 10 },
  signalement_valide_ia: { label: "Signalement validé (IA haute confiance)", points: 15 },
  signalement_resolu:    { label: "Signalement résolu ✅",          points: 5  },
  signalement_critique:  { label: "Alerte critique confirmée 🚨",  points: 20 },
  badge_vigilant:        { label: "Badge Vigilant débloqué 🎉",    points: 20 },
  badge_expert:          { label: "Badge Expert débloqué 🎉",      points: 30 },
  badge_champion:        { label: "Badge Champion débloqué 🎉",    points: 50 },
}

/**
 * Attribue des points à un citoyen pour un incident donné.
 * Calcule et attribue automatiquement les nouveaux badges.
 */
export async function awardPoints(
  userId: number,
  reason: keyof typeof POINTS_REASONS,
  incidentId?: number,
  quartier?: string,
): Promise<{ points: number; newBadges: BadgeCode[] }> {
  const db = await getDb()
  const def = POINTS_REASONS[reason]
  if (!def) return { points: 0, newBadges: [] }

  const now = new Date().toISOString()

  // Insérer les points
  db.prepare(
    "INSERT INTO citizen_points (user_id, incident_id, points, reason, quartier, awarded_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(userId, incidentId ?? null, def.points, reason, quartier ?? null, now)

  // Calculer le total (CAST pour éviter BigInt avec node:sqlite)
  const row = db.prepare("SELECT CAST(COALESCE(SUM(points),0) AS INTEGER) as total FROM citizen_points WHERE user_id = ?").get(userId) as { total: number | bigint }
  const total = Number(row.total)

  // Vérifier les nouveaux badges à attribuer
  const existingBadges = db.prepare("SELECT badge_code FROM citizen_badges WHERE user_id = ?").all(userId) as Array<{ badge_code: string }>
  const existingCodes = new Set(existingBadges.map(b => b.badge_code))

  const newBadges: BadgeCode[] = []
  const insBadge = db.prepare("INSERT OR IGNORE INTO citizen_badges (user_id, badge_code, awarded_at) VALUES (?, ?, ?)")

  for (const badge of BADGE_DEFINITIONS) {
    if (badge.threshold === 0) continue  // premier_pas géré séparément
    if (!existingCodes.has(badge.code) && total >= badge.threshold) {
      insBadge.run(userId, badge.code, now)
      newBadges.push(badge.code)
      // Bonus points pour le badge
      const bonusReason = `badge_${badge.code}` as keyof typeof POINTS_REASONS
      if (POINTS_REASONS[bonusReason]) {
        db.prepare(
          "INSERT INTO citizen_points (user_id, points, reason, quartier, awarded_at) VALUES (?, ?, ?, ?, ?)"
        ).run(userId, POINTS_REASONS[bonusReason].points, bonusReason, null, now)
      }
    }
  }

  return { points: def.points, newBadges }
}

/**
 * Appelé à la création d'un incident.
 * - 1er signalement de cet utilisateur → raison "premier_signalement" (+10 pts) + badge premier_pas
 * - Tous les suivants → raison "signalement_soumis" (+5 pts)
 */
export async function handleIncidentPointsOnCreate(
  userId: number,
  incidentId: number,
  quartier?: string,
): Promise<void> {
  const db = await getDb()
  const now = new Date().toISOString()

  // Déjà des points pour cet incident précis ? (évite doublons si appelé 2x)
  const alreadyAwarded = db.prepare(
    "SELECT id FROM citizen_points WHERE incident_id = ? AND user_id = ?"
  ).get(incidentId, userId)
  if (alreadyAwarded) return

  const prev = db.prepare(
    "SELECT COUNT(*) as c FROM citizen_points WHERE user_id = ? AND reason = 'premier_signalement'"
  ).get(userId) as { c: number }

  if (prev.c === 0) {
    // Tout premier signalement
    await awardPoints(userId, "premier_signalement", incidentId, quartier)
    db.prepare("INSERT OR IGNORE INTO citizen_badges (user_id, badge_code, awarded_at) VALUES (?, ?, ?)")
      .run(userId, "premier_pas", now)
  } else {
    // Signalements suivants : +5 pts à chaque soumission
    await awardPoints(userId, "signalement_soumis", incidentId, quartier)
  }
}

/**
 * Appelé quand un opérateur passe un incident en "Résolu".
 * Attribue les points de résolution au citoyen reporter.
 */
export async function handleIncidentPointsOnResolve(incidentId: number): Promise<void> {
  const db = await getDb()
  const row = db.prepare(
    "SELECT reporter_user_id, location FROM incidents WHERE id = ?"
  ).get(incidentId) as { reporter_user_id: number | null; location: string } | undefined

  if (!row || !row.reporter_user_id) return

  const quartier = extractQuartierFromLocation(row.location)
  await awardPoints(row.reporter_user_id, "signalement_resolu", incidentId, quartier)
}



/**
 * Appelé par l'IA lors de la corrélation d'un signalement citoyen avec une alerte réseau.
 * ia_confidence : 0-100
 */
export async function handleIncidentPointsFromAI(
  incidentId: number,
  iaConfidence: number,
  isCritical: boolean,
): Promise<void> {
  const db = await getDb()
  const row = db.prepare(
    "SELECT reporter_user_id, location FROM incidents WHERE id = ?"
  ).get(incidentId) as { reporter_user_id: number | null; location: string } | undefined

  if (!row || !row.reporter_user_id) return

  const quartier = extractQuartierFromLocation(row.location)

  // Déjà récompensé par l'IA pour cet incident ?
  const alreadyRewarded = db.prepare(
    "SELECT id FROM citizen_points WHERE incident_id = ? AND reason IN ('signalement_confirme','signalement_valide_ia','signalement_critique')"
  ).get(incidentId)
  if (alreadyRewarded) return

  if (isCritical && iaConfidence >= 70) {
    await awardPoints(row.reporter_user_id, "signalement_critique", incidentId, quartier)
  } else if (iaConfidence >= 75) {
    await awardPoints(row.reporter_user_id, "signalement_valide_ia", incidentId, quartier)
  } else if (iaConfidence >= 50) {
    await awardPoints(row.reporter_user_id, "signalement_confirme", incidentId, quartier)
  }
}

/** Récupère le profil complet de points d'un citoyen */
export async function getCitizenPointsProfile(userId: number): Promise<CitizenPointsProfile> {
  const db = await getDb()

  // Note: node:sqlite retourne SUM/COUNT comme BigInt → on caste avec Number()
  const totalRow = db.prepare(
    "SELECT CAST(COALESCE(SUM(points),0) AS INTEGER) as total FROM citizen_points WHERE user_id = ?"
  ).get(userId) as { total: number | bigint }
  const totalPoints = Number(totalRow.total)

  const badges = db.prepare(
    "SELECT badge_code as badgeCode, awarded_at as awardedAt FROM citizen_badges WHERE user_id = ? ORDER BY awarded_at ASC"
  ).all(userId) as Array<{ badgeCode: string; awardedAt: string }>

  const historyRaw = db.prepare(
    "SELECT id, points, reason, quartier, awarded_at as awardedAt FROM citizen_points WHERE user_id = ? ORDER BY awarded_at DESC LIMIT 30"
  ).all(userId) as Array<{ id: number | bigint; points: number | bigint; reason: string; quartier: string | null; awardedAt: string }>

  const history = historyRaw.map(r => ({
    id: Number(r.id),
    points: Number(r.points),
    reason: r.reason,
    quartier: r.quartier,
    awardedAt: r.awardedAt,
  }))

  const quartierRaw = db.prepare(`
    SELECT quartier, CAST(SUM(points) AS INTEGER) as points
    FROM citizen_points WHERE user_id = ? AND quartier IS NOT NULL
    GROUP BY quartier ORDER BY points DESC
  `).all(userId) as Array<{ quartier: string; points: number | bigint }>

  const quartierStats = quartierRaw.map(r => ({
    quartier: r.quartier,
    points: Number(r.points),
  }))

  // Rang global — requête simple sans sous-requête pour éviter les BigInt imbriqués
  const allTotals = db.prepare(
    "SELECT user_id, CAST(SUM(points) AS INTEGER) as total FROM citizen_points GROUP BY user_id"
  ).all() as Array<{ user_id: number | bigint; total: number | bigint }>

  const rank = allTotals.filter(r => Number(r.user_id) !== userId && Number(r.total) > totalPoints).length + 1

  const totalCitRow = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'citoyen'").get() as { c: number | bigint }

  return {
    totalPoints,
    rank,
    totalCitizens: Number(totalCitRow.c),
    badges: badges as any,
    history,
    quartierStats,
  }
}

/** Classement global + par quartier pour l'opérateur */
export async function getGlobalLeaderboard(): Promise<GlobalLeaderboard> {
  const db = await getDb()

  const citizensRaw = db.prepare(`
    SELECT
      u.id as userId,
      u.name,
      CAST(COALESCE(SUM(cp.points), 0) AS INTEGER) as totalPoints,
      CAST(COUNT(DISTINCT i.id) AS INTEGER) as signalements,
      CAST(COUNT(DISTINCT CASE WHEN cp2.reason IN ('signalement_confirme','signalement_valide_ia','signalement_critique') THEN cp2.incident_id END) AS INTEGER) as confirmes
    FROM users u
    LEFT JOIN citizen_points cp ON cp.user_id = u.id
    LEFT JOIN incidents i ON i.reporter_user_id = u.id
    LEFT JOIN citizen_points cp2 ON cp2.user_id = u.id
    WHERE u.role = 'citoyen'
    GROUP BY u.id, u.name
    ORDER BY totalPoints DESC
    LIMIT 50
  `).all() as Array<{ userId: number | bigint; name: string; totalPoints: number | bigint; signalements: number | bigint; confirmes: number | bigint }>
  const citizens = citizensRaw.map(c => ({
    userId: Number(c.userId),
    name: c.name,
    totalPoints: Number(c.totalPoints),
    signalements: Number(c.signalements),
    confirmes: Number(c.confirmes),
  }))

  // Badges pour chaque citoyen
  const allBadges = db.prepare(
    "SELECT user_id, badge_code FROM citizen_badges"
  ).all() as Array<{ user_id: number; badge_code: string }>
  const badgeMap = new Map<number, BadgeCode[]>()
  for (const b of allBadges) {
    const arr = badgeMap.get(b.user_id) ?? []
    arr.push(b.badge_code as BadgeCode)
    badgeMap.set(b.user_id, arr)
  }

  // Quartier principal par citoyen
  const quartierMap = new Map<number, string>()
  const qRows = db.prepare(`
    SELECT user_id, quartier, SUM(points) as pts FROM citizen_points
    WHERE quartier IS NOT NULL GROUP BY user_id, quartier
  `).all() as Array<{ user_id: number; quartier: string; pts: number }>
  const qByUser = new Map<number, Array<{ quartier: string; pts: number }>>()
  for (const r of qRows) {
    const arr = qByUser.get(r.user_id) ?? []
    arr.push({ quartier: r.quartier, pts: r.pts })
    qByUser.set(r.user_id, arr)
  }
  for (const [uid, arr] of qByUser) {
    arr.sort((a, b) => b.pts - a.pts)
    quartierMap.set(uid, arr[0].quartier)
  }

  const citizensList = citizens.map((c, idx) => ({
    rank: idx + 1,
    userId: c.userId,
    name: c.name,
    totalPoints: c.totalPoints,
    badges: badgeMap.get(c.userId) ?? [],
    quartierPrincipal: quartierMap.get(c.userId) ?? null,
    signalements: c.signalements,
    confirmes: c.confirmes,
  }))

  // Classements par quartier
  const QUARTIERS = ["Plateau","Médina","Fann","HLM","Grand Dakar","Parcelles Assainies","Pikine","Guédiawaye","Rufisque"]
  const quartierLeaderboards: QuartierLeaderboard[] = []

  for (const q of QUARTIERS) {
    const top = db.prepare(`
      SELECT u.id as userId, u.name, COALESCE(SUM(cp.points),0) as points
      FROM users u
      LEFT JOIN citizen_points cp ON cp.user_id = u.id AND cp.quartier = ?
      WHERE u.role = 'citoyen'
      GROUP BY u.id, u.name
      HAVING points > 0
      ORDER BY points DESC LIMIT 5
    `).all(q) as Array<{ userId: number; name: string; points: number }>

    const sigRow = db.prepare(`
      SELECT COUNT(*) as total FROM incidents WHERE location LIKE ?
    `).get(`%${q}%`) as { total: number }

    const confRow = db.prepare(`
      SELECT COUNT(DISTINCT cp.incident_id) as confirmes
      FROM citizen_points cp
      JOIN incidents i ON i.id = cp.incident_id
      WHERE cp.quartier = ? AND cp.reason IN ('signalement_confirme','signalement_valide_ia','signalement_critique')
    `).get(q) as { confirmes: number }

    const total = sigRow.total
    const confirmes = confRow.confirmes
    quartierLeaderboards.push({
      quartier: q,
      topCitizens: top.map(t => ({
        ...t,
        badges: badgeMap.get(t.userId) ?? [],
      })),
      totalSignalements: total,
      totalConfirmes: confirmes,
      tauxConfirmation: total > 0 ? Math.round((confirmes / total) * 100) : 0,
    })
  }

  return {
    updatedAt: new Date().toISOString(),
    citizens: citizensList,
    quartierLeaderboards,
  }
}
