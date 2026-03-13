export type UserRole = "citoyen" | "operateur" | "admin"

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface FlowPoint {
  time: string
  debit: number
  pression: number
}

export interface AlertPoint {
  jour: string
  alertes: number
}

export interface QualityPoint {
  time: string
  value: number
}

export interface QualityParameter {
  label: string
  value: string
  unit: string
  status: "normal" | "alerte" | "critique"
  min: string
  max: string
  description: string
}

export interface CitizenDashboardData {
  qualityScore: number
  temperature: number
  networkState: string
  activeAlerts: number
  networkHealth: number
  activeSensorsRate: number
  pressureRate: number
  waterQualityIndicators: Array<{
    label: string
    value: string
    status: "normal" | "alerte" | "critique"
    target: string
  }>
  recentAlerts: Array<{
    id: string
    message: string
    time: string
    type: "normal" | "alerte" | "critique"
  }>
}

export interface CitizenNetworkSector {
  id: number
  name: string
  status: "normal" | "alerte" | "critique"
  health: number
  sensors: number
  pressure: string
}

export interface CitizenQualityData {
  phData: QualityPoint[]
  turbidityData: QualityPoint[]
  parameters: QualityParameter[]
}

export interface MapNode {
  id: string
  x: number
  y: number
  type: "reservoir" | "pump" | "sensor" | "valve" | "junction"
  label: string
  status: "normal" | "alerte" | "critique"
  data: Record<string, string>
}

export interface MapData {
  nodes: MapNode[]
  connections: [string, string][]
}

export interface OperatorDashboardData {
  kpis: {
    leakDetections: number
    activeAlerts: number
    criticalAlerts: number
    networkHealth: number
    activeSensors: number
    availabilityRate: number
  }
  flowData: FlowPoint[]
  alertsData: AlertPoint[]
  recentAlerts: Array<{
    id: string
    type: string
    location: string
    severity: "critique" | "alerte" | "moyen" | "faible"
    probability: string
    time: string
  }>
  sensorStatus: Array<{
    label: string
    count: number
    color: string
  }>
}

export interface OperatorAlert {
  id: string
  type: string
  classification: string
  location: string
  severity: "critique" | "alerte" | "moyen" | "faible"
  probability: string
  date: string
  status: string
}

export interface MaintenanceTask {
  id: string
  asset: string
  type: string
  priority: "Haute" | "Moyenne" | "Basse"
  dueDate: string
  confidence: number
  status: "Urgent" | "Planifie" | "En cours" | "Termine"
}

export interface SensorItem {
  id: string
  type: string
  location: string
  status: "actif" | "alerte" | "inactif"
  battery: number
  signal: number
  lastUpdate: string
  name?: string
  model?: string
  firmware?: string
  sector?: string
  enabled?: boolean
}

export interface SimulationItem {
  id: string
  name: string
  scenario: string
  status: "Planifie" | "En cours" | "Termine"
  date: string
  resultRisk: "Eleve" | "Moyen" | "Faible" | "-"
  duration: string
}

export interface AdminDashboardData {
  kpis: {
    activeUsers: number
    sensors: number
    uptime: string
    processedAlerts: number
  }
  systemMetrics: Array<{ name: string; value: number }>
  userActivity: Array<{ month: string; users: number }>
  sensorDistribution: Array<{ name: string; value: number; color: string }>
  security: Array<{ label: string; status: string; color: string }>
}

export interface AdminUserItem {
  id: number
  name: string
  email: string
  role: "Citoyen" | "Operateur" | "Administrateur"
  status: boolean
  lastLogin: string
  initials: string
}

export interface AppSettings {
  orgName: string
  timezone: string
  apiKey: string
  notifications: {
    criticalEmail: boolean
    dailyReport: boolean
    predictiveMaintenance: boolean
    citizenReports: boolean
  }
  security: {
    require2FA: boolean
    sessionExpiry: "1h" | "4h" | "8h" | "24h"
    auditLogs: boolean
  }
  database: {
    autoBackup: boolean
    retentionPeriod: "3m" | "6m" | "1y" | "5y"
  }
}

// ── Signalements Citoyens ──────────────────────────────────────────────────

export interface CitizenIncident {
  id: number
  type: string
  location: string
  description: string
  status: "Nouveau" | "En cours" | "Résolu" | "Fermé"
  createdAt: string
  resolvedAt: string | null
  reporterName: string | null
}

export interface OperatorIncident {
  id: number
  type: string
  location: string
  description: string
  status: "Nouveau" | "En cours" | "Résolu" | "Fermé"
  createdAt: string
  resolvedAt: string | null
  reporterName: string | null
  reporterEmail: string | null
  reporterUserId: number | null
}

export interface IncidentSummary {
  nouveau: number
  enCours: number
  resolu: number
  total: number
}

// ── Qualité avec tendance ──────────────────────────────────────────────────

export interface QualityParameterWithTrend extends QualityParameter {
  trend: number[]   // 7 points (J-6 → J)
  trendDirection: "up" | "down" | "stable"
}
