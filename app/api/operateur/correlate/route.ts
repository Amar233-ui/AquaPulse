import { NextResponse } from "next/server"
import { authErrorResponse, requireUser } from "@/lib/server/session"
import { handleIncidentPointsFromAI } from "@/lib/server/data-service"

const AI_BASE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000"
const AI_TOKEN    = process.env.AI_SERVICE_TOKEN ?? "aquapulse-ai-dev-token"

export interface Correlation {
  alertId:    string
  alertType:  string
  location:   string
  severity:   string
  confidence: number
  reasons:    string[]
  status:     string
  date:       string
  source:     "ai" | "db"
}

export interface CorrelateResponse {
  incidentId:     number
  correlations:   Correlation[]
  hasCorrelation: boolean
  analyzed:       number
  mode?:          "network" | "eah"
  message?:       string
}

export async function POST(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])

    const body = (await request.json()) as {
      id:          number
      type:        string
      location:    string
      description: string
      createdAt?:  string
      eahFacilityId?: number | null
      eahFacilityName?: string | null
    }

    const normalizedType = body.type.toLowerCase().trim()
    const isEahIncident =
      Boolean(body.eahFacilityId) ||
      normalizedType.includes("eah") ||
      normalizedType.includes("latrine") ||
      normalizedType.includes("hygiene") ||
      normalizedType.includes("lavage_mains") ||
      normalizedType.includes("panne_eah") ||
      normalizedType.includes("autre_eah") ||
      Boolean(body.eahFacilityName)

    if (isEahIncident) {
      return NextResponse.json({
        incidentId: body.id,
        correlations: [],
        hasCorrelation: false,
        analyzed: 0,
        mode: "eah",
        message: body.eahFacilityName
          ? `Signalement EAH lié à ${body.eahFacilityName} : la corrélation réseau IA n'est pas applicable.`
          : "Signalement EAH : la corrélation réseau IA n'est pas applicable.",
      } satisfies CorrelateResponse)
    }

    // Appel au service IA Python (avec fallback local DB)
    const localFallback = async () => {
      const { correlateIncidentLocal } = await import("@/lib/server/ai-local")
      const data = await correlateIncidentLocal({
        id: body.id,
        type: body.type,
        location: body.location,
        description: body.description,
        createdAt: body.createdAt,
      })

      // Attribuer les points IA si corrélation trouvée (fallback local inclus)
      if (data.hasCorrelation && data.correlations.length > 0 && body.id) {
        const bestCorr = data.correlations[0]
        const isCritical = bestCorr.severity === "critique"
        handleIncidentPointsFromAI(body.id, bestCorr.confidence, isCritical).catch(() => {})
      }

      return { ...data, mode: "network" } satisfies CorrelateResponse
    }

    let res: Response | null = null
    try {
      res = await fetch(`${AI_BASE_URL}/correlate`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${AI_TOKEN}`,
        },
        body:   JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      })
    } catch {
      res = null
    }

    if (!res || !res.ok) {
      // Service IA down → retourner pas de corrélation (pas d'erreur visible)
      return NextResponse.json(await localFallback())
    }

    const data = (await res.json()) as CorrelateResponse

    // Attribuer les points IA si corrélation trouvée
    if (data.hasCorrelation && data.correlations.length > 0 && body.id) {
      const bestCorr = data.correlations[0]
      const isCritical = bestCorr.severity === "critique"
      // Ne pas attendre pour ne pas bloquer la réponse
      handleIncidentPointsFromAI(body.id, bestCorr.confidence, isCritical).catch(() => {})
    }

    return NextResponse.json(data)

  } catch (error) {
    // Timeout ou service down → fallback silencieux
    return NextResponse.json({
      incidentId:     0,
      correlations:   [],
      hasCorrelation: false,
      analyzed:       0,
    } satisfies CorrelateResponse)
  }
}
