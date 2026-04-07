/**
 * AquaPulse AI Client
 * ===================
 * Utilitaire serveur pour appeler le microservice Python IA.
 * Utilisé depuis les routes API Next.js.
 *
 * Usage :
 *   import { aiClient } from "@/lib/server/ai-client"
 *   const anomalies = await aiClient.getAnomalies()
 */

const AI_BASE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000"
const AI_TOKEN    = process.env.AI_SERVICE_TOKEN ?? "aquapulse-ai-dev-token"

const AI_ENABLED = process.env.AI_ENABLED !== "false"   // true par défaut

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${AI_TOKEN}`,
}

async function fetchAI<T>(
  path: string,
  options: RequestInit = {},
  fallback: T,
): Promise<{ data: T; fromAI: boolean }> {
  if (!AI_ENABLED) {
    return { data: fallback, fromAI: false }
  }

  try {
    const res = await fetch(`${AI_BASE_URL}${path}`, {
      ...options,
      headers: { ...BASE_HEADERS, ...options.headers },
      // Timeout court — si l'IA est down, on fallback sur la DB
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      console.warn(`[AI] ${path} → ${res.status}`)
      return { data: fallback, fromAI: false }
    }

    const data = (await res.json()) as T
    return { data, fromAI: true }
  } catch (err) {
    // Service IA indisponible → fallback transparent sur la DB
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[AI] Service indisponible (${path}) :`, (err as Error).message)
    }
    return { data: fallback, fromAI: false }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export interface AIAnomaly {
  id: string
  type: string
  classification: string
  location: string
  severity: "critique" | "alerte" | "moyen" | "faible"
  probability: number
  status: string
  description: string
  source: string
  date: string
  source_type: "ai_generated" | "manual"
}

export interface AIAnomaliesResponse {
  alerts:        AIAnomaly[]
  summary:       { total: number; critique: number; alerte: number; moyen: number; faible: number }
  generated_at:  string
  model_version: string
}

export interface AIKPIs {
  leakDetections:     number
  activeAlerts:       number
  criticalAlerts:     number
  networkHealth:      number
  predictedLeaks24h:  number
  maintenanceUrgent:  number
  qualityScore:       number
  qualityTrend:       "stable" | "degrading" | "improving"
}

export interface AIMaintenanceAsset {
  asset_id:           string
  asset_name:         string
  risk_score:         number
  risk_percent:       number
  urgency:            "urgent" | "planifier" | "surveiller"
  recommended_action: string
  due_date:           string
  days_until:         number
  ai_confidence:      number
}

export interface AIQuality {
  current_score: number
  trend_24h:     "stable" | "degrading" | "improving"
  current:       { ph: number; turbidity: number; chlorine: number; temperature: number }
  forecast_6h:   { ph: number; turbidity: number }
  forecast_24h:  { ph: number }
  alerts:        Array<{ metric: string; value: number; message: string; severity: string }>
}

// ─────────────────────────────────────────────────────────────────────────────

export const aiClient = {

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${AI_BASE_URL}/health`, {
        signal: AbortSignal.timeout(2000),
      })
      return res.ok
    } catch {
      // Même si le microservice Python est down, on a un fallback local (DB).
      return AI_ENABLED
    }
  },

  async getAnomalies(): Promise<{ data: AIAnomaliesResponse; fromAI: boolean }> {
    const remote = await fetchAI<AIAnomaliesResponse>(
      "/anomalies",
      {},
      { alerts: [], summary: { total:0, critique:0, alerte:0, moyen:0, faible:0 }, generated_at: "", model_version: "" }
    )

    if (remote.fromAI) return remote

    try {
      const { getLocalAnomalies } = await import("./ai-local")
      const local = await getLocalAnomalies()
      return { data: local, fromAI: AI_ENABLED }
    } catch {
      return remote
    }
  },

  async getKPIs(): Promise<{ data: AIKPIs; fromAI: boolean }> {
    const remote = await fetchAI<AIKPIs>(
      "/dashboard/kpis",
      {},
      {
        leakDetections: 0, activeAlerts: 0, criticalAlerts: 0,
        networkHealth: 0, predictedLeaks24h: 0, maintenanceUrgent: 0,
        qualityScore: 0, qualityTrend: "stable",
      }
    )

    if (remote.fromAI) return remote

    try {
      const { getLocalKPIs } = await import("./ai-local")
      const local = await getLocalKPIs()
      return { data: local, fromAI: AI_ENABLED }
    } catch {
      return remote
    }
  },

  async getMaintenance(): Promise<{ data: { assets: AIMaintenanceAsset[] }; fromAI: boolean }> {
    const remote = await fetchAI<{ assets: AIMaintenanceAsset[] }>(
      "/predict/maintenance",
      {},
      { assets: [] }
    )

    if (remote.fromAI) return remote

    try {
      const { getLocalMaintenance } = await import("./ai-local")
      const local = await getLocalMaintenance()
      return { data: local, fromAI: AI_ENABLED }
    } catch {
      return remote
    }
  },

  async getQuality(): Promise<{ data: AIQuality; fromAI: boolean }> {
    const remote = await fetchAI<AIQuality>(
      "/predict/quality",
      {},
      {
        current_score: 0, trend_24h: "stable",
        current: { ph: 7.2, turbidity: 0.8, chlorine: 0.5, temperature: 28 },
        forecast_6h:  { ph: 7.2, turbidity: 0.8 },
        forecast_24h: { ph: 7.2 },
        alerts: [],
      }
    )

    if (remote.fromAI) return remote

    try {
      const { getLocalQuality } = await import("./ai-local")
      const local = await getLocalQuality()
      return { data: local, fromAI: AI_ENABLED }
    } catch {
      return remote
    }
  },

  async getLeaks(): Promise<{ data: { segments: Array<{ zone: string; risk_score: number; risk: string }> }; fromAI: boolean }> {
    return fetchAI(
      "/predict/leaks",
      {},
      { segments: [] }
    )
  },

  async retrain(): Promise<boolean> {
    try {
      const res = await fetch(`${AI_BASE_URL}/retrain`, {
        method: "POST",
        headers: BASE_HEADERS,
        signal: AbortSignal.timeout(30000),  // l'entraînement peut prendre du temps
      })
      return res.ok
    } catch {
      return false
    }
  },
}
