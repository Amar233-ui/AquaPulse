import { NextResponse } from "next/server"

import { getLatestSimulationRun, runSimulation } from "@/lib/server/data-service"
import { authErrorResponse, requireUser } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    await requireUser(request, ["operateur", "admin"])
    const latest = await getLatestSimulationRun()
    return NextResponse.json(latest)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request, ["operateur", "admin"])
    const body = (await request.json()) as {
      name?: string
      scenario?: string
      drought?: number
      population?: number
      duration?: "24h" | "7j" | "30j" | "1a"
    }

    const scenario = body.scenario?.trim() || "Secheresse"
    const drought = Math.min(100, Math.max(0, Number(body.drought ?? 30)))
    const population = Math.min(50, Math.max(0, Number(body.population ?? 15)))
    const duration = body.duration && ["24h", "7j", "30j", "1a"].includes(body.duration) ? body.duration : "24h"

    const result = await runSimulation({
      name: body.name,
      scenario,
      drought,
      population,
      duration,
      createdBy: user.id,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}
