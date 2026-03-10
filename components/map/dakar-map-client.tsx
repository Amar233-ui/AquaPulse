"use client"

import L from "leaflet"
import { useEffect, useMemo, useState } from "react"
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet"

import network from "@/data/dakar_network.json"
import sensors from "@/data/dakar_sensors.json"

type Mode = "monitoring" | "simulation"

type Alert = {
  id: string
  kind: "leak" | "contamination"
  severity: "low" | "medium" | "high" | "critical"
  score: number
  message: string
  sensorId?: string
  nodeId?: string
  location: { lat: number; lng: number }
}

type SimEvent =
  | { kind: "leak"; pipeId: string }
  | { kind: "contamination"; at: { lat: number; lng: number } }
  | { kind: "pump_failure"; nodeId: string }

const SEV: Record<Alert["severity"], string> = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444"
}

function pipeStyle(mode: Mode, pipeId: string, simEvents: SimEvent[]) {
  if (mode !== "simulation") return { color: "#2563eb", weight: 4, opacity: 0.85 }
  const hasLeak = simEvents.some((e) => e.kind === "leak" && e.pipeId === pipeId)
  if (hasLeak) return { color: "#ef4444", weight: 7, opacity: 0.95, dashArray: "10 6" }
  return { color: "#2563eb", weight: 4, opacity: 0.35 }
}

function ClickCapture({
  mode,
  tool,
  onAdd,
}: {
  mode: Mode
  tool: "leak" | "contamination" | "pump_failure" | null
  onAdd: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (mode !== "simulation") return
      if (tool !== "contamination") return
      onAdd(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function DakarMap({ mode }: { mode: Mode }) {
  const center: [number, number] = [14.6937, -17.4441]

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [t, setT] = useState<number | null>(null)

  const [simEvents, setSimEvents] = useState<SimEvent[]>([])
  const [simTool, setSimTool] = useState<"leak" | "contamination" | "pump_failure" | null>(null)

  useEffect(() => {
    if (mode !== "monitoring") return
    let alive = true

    const tick = async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" })
        if (!alive) return
        const json = await res.json()
        setT(json.t ?? null)
        setAlerts(json.alerts ?? [])
      } catch {}
    }

    tick()
    const id = setInterval(tick, 2500)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [mode])

  useEffect(() => {
    if (mode !== "simulation") return
    let alive = true

    const tick = async () => {
      try {
        const res = await fetch("/api/sim/state", { cache: "no-store" })
        if (!alive) return
        const json = await res.json()
        setSimEvents(json.events ?? [])
      } catch {}
    }

    tick()
    const id = setInterval(tick, 1200)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [mode])

  const resetSim = async () => {
    await fetch("/api/sim/reset", { method: "POST" })
  }

  const addContaminationAt = async (lat: number, lng: number) => {
    await fetch("/api/sim/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "contamination", at: { lat, lng } }),
    })
  }

  const onEachNetworkFeature = (feature: any, layer: L.Layer) => {
    const kind = feature?.properties?.kind

    if (kind === "pipe" && mode === "simulation") {
      const pipeId = feature.properties.id as string
      layer.on("click", async () => {
        if (simTool !== "leak") return
        await fetch("/api/sim/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "leak", pipeId }),
        })
      })
    }

    if (kind === "node" && mode === "simulation") {
      const nodeId = feature.properties.id as string
      layer.on("click", async () => {
        if (simTool !== "pump_failure") return
        await fetch("/api/sim/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "pump_failure", nodeId }),
        })
      })
    }
  }

  const networkStyle = (feature: any) => {
    if (feature?.properties?.kind === "pipe") {
      return pipeStyle(mode, feature.properties.id, simEvents)
    }
    return { color: "#0ea5e9", weight: 2, opacity: 0.6 }
  }

  const sensorsFeatures = (sensors as any).features as any[]

  const simKpis = useMemo(() => {
    const leaks = simEvents.filter((e) => e.kind === "leak").length
    const cont = simEvents.filter((e) => e.kind === "contamination").length
    const pumps = simEvents.filter((e) => e.kind === "pump_failure").length
    return { leaks, cont, pumps }
  }, [simEvents])

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-xl border border-border/60">
        <MapContainer center={center} zoom={13} style={{ height: 560, width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickCapture mode={mode} tool={simTool} onAdd={addContaminationAt} />

          <GeoJSON data={network as any} style={networkStyle as any} onEachFeature={onEachNetworkFeature as any} />

          {mode === "monitoring" &&
            sensorsFeatures.map((f) => {
              const sid = f.properties.id as string
              const coords = f.geometry.coordinates as [number, number]
              const lat = coords[1]
              const lng = coords[0]
              const related = alerts.find((a) => a.sensorId === sid)
              const color = related ? SEV[related.severity] : "#22c55e"

              return (
                <CircleMarker
                  key={sid}
                  center={[lat, lng]}
                  radius={7}
                  pathOptions={{ color, weight: 3, fillOpacity: 0.9 }}
                >
                  <Popup>
                    <b>{f.properties.label}</b>
                    <br />
                    ID: {sid}
                    <br />
                    Type: {f.properties.type}
                    <br />
                    Node: {f.properties.nodeId}
                  </Popup>
                </CircleMarker>
              )
            })}

          {mode === "monitoring" &&
            alerts.map((a) => (
              <CircleMarker
                key={a.id}
                center={[a.location.lat, a.location.lng]}
                radius={10}
                pathOptions={{ color: SEV[a.severity], weight: 4, fillOpacity: 0.2 }}
              >
                <Popup>
                  <b>{a.kind.toUpperCase()}</b>
                  <br />
                  {a.message}
                  <br />
                  severity: {a.severity} • score: {a.score}
                  <br />
                  sensor: {a.sensorId} • node: {a.nodeId}
                </Popup>
              </CircleMarker>
            ))}

          {mode === "simulation" &&
            simEvents
              .filter((e) => e.kind === "contamination")
              .map((e: any, idx: number) => (
                <CircleMarker
                  key={`sim-cont-${idx}`}
                  center={[e.at.lat, e.at.lng]}
                  radius={16}
                  pathOptions={{ color: "#ef4444", weight: 4, fillOpacity: 0.12 }}
                >
                  <Popup>
                    <b>Contamination simulée</b>
                  </Popup>
                </CircleMarker>
              ))}
        </MapContainer>
      </div>

      <div className="rounded-xl border border-border/60 bg-background p-4">
        {mode === "monitoring" ? (
          <>
            <div className="text-sm font-semibold">Monitoring • Dakar</div>
            <div className="mt-1 text-xs text-muted-foreground">Frame: {t ?? "-"} • refresh ~2.5s</div>

            <div className="mt-4 text-sm font-semibold">Alertes actives</div>
            <div className="mt-2 grid gap-2">
              {alerts.length === 0 && <div className="text-sm text-muted-foreground">Aucune alerte</div>}
              {alerts.slice(0, 10).map((a) => (
                <div key={a.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{a.kind.toUpperCase()}</span>
                    <span className="text-xs" style={{ color: SEV[a.severity] }}>
                      {a.severity} • {a.score}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.message}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    sensor {a.sensorId} • node {a.nodeId}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold">Simulation • Dakar</div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button className={btn(simTool === "leak")} onClick={() => setSimTool("leak")}>
                Fuite
              </button>
              <button className={btn(simTool === "contamination")} onClick={() => setSimTool("contamination")}>
                Contamination
              </button>
              <button className={btn(simTool === "pump_failure")} onClick={() => setSimTool("pump_failure")}>
                Panne pompe
              </button>
              <button className={btn(false, true)} onClick={resetSim}>
                Reset
              </button>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              Tool actif: <b>{simTool ?? "aucun"}</b>
            </div>

            <div className="mt-4 grid gap-2">
              <Kpi label="Fuites simulées" value={simKpis.leaks} />
              <Kpi label="Contaminations simulées" value={simKpis.cont} />
              <Kpi label="Pannes pompe simulées" value={simKpis.pumps} />
            </div>

            <div className="mt-4 text-sm font-semibold">Événements</div>
            <div className="mt-2 grid gap-2">
              {simEvents.length === 0 && <div className="text-sm text-muted-foreground">Aucun événement</div>}
              {simEvents.slice(-10).reverse().map((e, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3 text-sm">
                  <b>{e.kind}</b> {"pipeId" in e ? `• ${e.pipeId}` : ""} {"nodeId" in e ? `• ${e.nodeId}` : ""}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function btn(active: boolean, danger = false) {
  const base =
    "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors " +
    (danger ? "border-red-500/50 hover:bg-red-500/10" : "border-border/60 hover:bg-muted/40")
  if (!active) return base
  return base + " bg-sky-500/10 border-sky-500/50"
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-extrabold">{value}</div>
    </div>
  )
}
