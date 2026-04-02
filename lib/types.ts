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

export type NotificationCategory = "alertes" | "signalements" | "maintenance" | "eah"

export interface NotificationItem {
  id: string
  category: NotificationCategory
  title: string
  description: string
  href: string
  severity: "critique" | "alerte" | "moyen" | "faible" | "normal"
  createdAt: string
  time: string
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
  zonePressures?: Array<{
    zone: string
    pressure: number
    status: "normal" | "alerte" | "critique"
  }>
  requiredActions?: Array<{
    id: string
    type: "signalement" | "alerte" | "maintenance" | "capteur" | "eah"
    label: string
    time: string
    urgency: "high" | "medium" | "low"
    href: string
    source: "db" | "ai" | "hybrid"
  }>
  activityFeed?: Array<{
    id: string
    kind: "alerte" | "signalement" | "maintenance" | "eah"
    title: string
    subtitle: string
    time: string
    severity: "critique" | "alerte" | "moyen" | "faible" | "normal"
    source: "ai" | "historique" | "terrain" | "maintenance" | "eah" | "hybrid"
    href: string
    ctaLabel: string
  }>
  systemStatus?: {
    label: string
    tone: "normal" | "warning" | "critical"
  }
  ai_available?: boolean
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
  description?: string
  source_type?: "ai_generated" | "db" | "manual"
}

export interface MaintenanceTask {
  id: string
  asset: string
  type: string
  priority: "Haute" | "Moyenne" | "Basse"
  dueDate: string
  confidence: number
  status: "Urgent" | "Planifie" | "En cours" | "Termine"
  source?: "ai" | "db"
  alertId?: string | null
  eahFacilityId?: number | null
  assignedOperatorId?: number | null
  assignedOperatorName?: string | null
  assignedAt?: string | null
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
  eahFacilityId?: number | null
  eahFacilityName?: string | null
  assignedOperatorId?: number | null
  assignedOperatorName?: string | null
  assignedAt?: string | null
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

// ── Module EAH (Eau, Assainissement, Hygiène) ─────────────────────────────

export type EahFacilityType =
  | "latrine_publique"
  | "point_eau_gratuit"
  | "borne_fontaine"
  | "bloc_hygiene"
  | "station_lavage_mains"

export type EahFacilityStatus = "operationnel" | "degradé" | "hors_service"

export interface EahFacility {
  id: number
  name: string
  type: EahFacilityType
  quartier: string
  address: string
  status: EahFacilityStatus
  gender_accessible: boolean   // accessible femmes / hygiène menstruelle
  disabled_accessible: boolean
  school_nearby: boolean
  last_inspection: string | null
  notes: string | null
  created_at: string
  updated_at: string
  community_signal_count?: number
  community_unique_reporters?: number
  community_confirmation?: "none" | "to_verify" | "probable" | "confirmed"
  last_community_report_at?: string | null
}

export interface EahZoneStat {
  quartier: string
  total: number
  operationnel: number
  hors_service: number
  score: number          // 0–100 score d'accès EAH
  has_gender_facility: boolean
}

export interface EahDashboardData {
  stats: {
    total_facilities: number
    operational: number
    degraded: number
    out_of_service: number
    gender_accessible: number
    schools_covered: number
  }
  zone_stats: EahZoneStat[]
  recent_reports: EahFacility[]
}

// ── Système de Points & Badges ────────────────────────────────────────────────

export type BadgeCode =
  | "premier_pas"
  | "vigilant"
  | "expert"
  | "champion"
  | "sentinelle"
  | "ambassadeur"

export interface BadgeDefinition {
  code: BadgeCode
  label: string
  description: string
  icon: string
  color: string
  threshold: number   // points nécessaires (sauf badges spéciaux)
}

export interface CitizenPointsEntry {
  id: number
  points: number
  reason: string
  quartier: string | null
  awardedAt: string
}

export interface CitizenBadge {
  badgeCode: BadgeCode
  awardedAt: string
}

export interface CitizenPointsProfile {
  totalPoints: number
  rank: number            // rang global
  totalCitizens: number   // nb total citoyens
  badges: CitizenBadge[]
  history: CitizenPointsEntry[]
  quartierStats: Array<{ quartier: string; points: number }>
}

export interface QuartierLeaderboard {
  quartier: string
  topCitizens: Array<{
    userId: number
    name: string
    points: number
    badges: BadgeCode[]
  }>
  totalSignalements: number
  totalConfirmes: number
  tauxConfirmation: number
}

export interface GlobalLeaderboard {
  updatedAt: string
  citizens: Array<{
    rank: number
    userId: number
    name: string
    totalPoints: number
    badges: BadgeCode[]
    quartierPrincipal: string | null
    signalements: number
    confirmes: number
  }>
  quartierLeaderboards: QuartierLeaderboard[]
}
