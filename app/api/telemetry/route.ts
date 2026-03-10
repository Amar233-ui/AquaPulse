import telemetry from "@/data/telemetry_series.json"

let idx = 0

export async function GET() {
  const frames = (telemetry as any).frames as any[]
  const frame = frames[idx % frames.length]
  idx++
  return Response.json({ t: frame.t, measurements: frame.measurements })
}
