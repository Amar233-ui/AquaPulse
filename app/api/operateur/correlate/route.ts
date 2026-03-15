import { NextResponse } from "next/server"
import { authErrorResponse, requireUser } from "@/lib/server/session"

const AI_BASE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000"
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
    }

    // Appel au service IA Python
    const res = await fetch(`${AI_BASE_URL}/correlate`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${AI_TOKEN}`,
      },
      body:   JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      // Service IA down → retourner pas de corrélation (pas d'erreur visible)
      return NextResponse.json({
        incidentId:     body.id,
        correlations:   [],
        hasCorrelation: false,
        analyzed:       0,
      } satisfies CorrelateResponse)
    }

    const data = (await res.json()) as CorrelateResponse
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
