import sensors from "@/data/dakar_sensors.json"
import telemetry from "@/data/telemetry_series.json"

let idx = 0

function severity(score: number) {
  if (score >= 0.85) return "critical"
  if (score >= 0.65) return "high"
  if (score >= 0.45) return "medium"
  return "low"
}

export async function GET() {
  const frames = (telemetry as any).frames as any[]
  const frame = frames[idx % frames.length]
  idx++

  const features = (sensors as any).features as any[]
  const alerts: any[] = []

  for (const f of features) {
    const sid = f.properties.id as string
    const stype = f.properties.type as string
    const m = frame.measurements?.[sid]
    if (!m) continue

    if (stype === "acoustic" && m.acoustic >= 0.75 && m.pressure <= 2.4) {
      const sc = Math.min(1, 0.65 * m.acoustic + 0.35 * (2.6 - m.pressure))
      alerts.push({
        id: `A-LEAK-${sid}-${frame.t}`,
        kind: "leak",
        severity: severity(sc),
        score: Number(sc.toFixed(2)),
        sensorId: sid,
        nodeId: f.properties.nodeId,
        message: "Suspicion de fuite (acoustique + chute de pression)",
        location: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }
      })
    }

    if (stype === "turbidity" && m.turbidity >= 7.0) {
      const sc = Math.min(1, m.turbidity / 10)
      alerts.push({
        id: `A-TURB-${sid}-${frame.t}`,
        kind: "contamination",
        severity: severity(sc),
        score: Number(sc.toFixed(2)),
        sensorId: sid,
        nodeId: f.properties.nodeId,
        message: "Turbidité élevée : risque sanitaire",
        location: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }
      })
    }

    if (stype === "ph" && (m.ph <= 6.3 || m.ph >= 8.5)) {
      const sc = Math.min(1, Math.abs(7.2 - m.ph) / 2.0)
      alerts.push({
        id: `A-PH-${sid}-${frame.t}`,
        kind: "contamination",
        severity: severity(sc),
        score: Number(sc.toFixed(2)),
        sensorId: sid,
        nodeId: f.properties.nodeId,
        message: "pH anormal : possible contamination",
        location: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }
      })
    }
  }

  return Response.json({ t: frame.t, alerts })
}
