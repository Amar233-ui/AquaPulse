"use client"

import { useEffect, useRef, useState } from "react"

// ── Data embarquée ────────────────────────────────────────────────────────────
const NETWORK = {"nodes":[{"id":"R1","type":"reservoir","name":"Château d'Eau Plateau","lat":14.6937,"lng":-17.4441,"zone":"Plateau","capacity_m3":50000},{"id":"R2","type":"reservoir","name":"Réservoir Médina","lat":14.6891,"lng":-17.4512,"zone":"Médina","capacity_m3":35000},{"id":"R3","type":"reservoir","name":"Réservoir Pikine","lat":14.7512,"lng":-17.3891,"zone":"Pikine","capacity_m3":45000},{"id":"P1","type":"pump","name":"Station Pompage Fann","lat":14.6978,"lng":-17.4623,"zone":"Fann","flow_m3h":1200},{"id":"P2","type":"pump","name":"Station Pompage HLM","lat":14.7089,"lng":-17.4401,"zone":"HLM","flow_m3h":900},{"id":"P3","type":"pump","name":"Station Pompage Parcelles","lat":14.7334,"lng":-17.4123,"zone":"Parcelles Assainies","flow_m3h":1100},{"id":"V1","type":"valve","name":"Vanne Médina Nord","lat":14.6945,"lng":-17.4478,"zone":"Médina","open_pct":100},{"id":"V2","type":"valve","name":"Vanne Grand Dakar","lat":14.7123,"lng":-17.4289,"zone":"Grand Dakar","open_pct":75},{"id":"V3","type":"valve","name":"Vanne Guédiawaye","lat":14.7445,"lng":-17.4034,"zone":"Guédiawaye","open_pct":100},{"id":"J1","type":"junction","name":"Nœud Central Plateau","lat":14.6912,"lng":-17.4467,"zone":"Plateau"},{"id":"J2","type":"junction","name":"Nœud HLM-Médina","lat":14.7034,"lng":-17.4356,"zone":"HLM"},{"id":"J3","type":"junction","name":"Nœud Pikine Est","lat":14.7489,"lng":-17.3956,"zone":"Pikine"}],"pipes":[{"id":"PIPE-01","from":"R1","to":"P1","diameter_mm":400,"length_m":820,"material":"fonte","zone":"Plateau-Fann"},{"id":"PIPE-02","from":"P1","to":"J1","diameter_mm":350,"length_m":640,"material":"PVC","zone":"Plateau"},{"id":"PIPE-03","from":"J1","to":"V1","diameter_mm":300,"length_m":480,"material":"PVC","zone":"Médina"},{"id":"PIPE-04","from":"V1","to":"R2","diameter_mm":300,"length_m":390,"material":"fonte","zone":"Médina"},{"id":"PIPE-05","from":"R2","to":"J2","diameter_mm":350,"length_m":720,"material":"PVC","zone":"HLM"},{"id":"PIPE-06","from":"J1","to":"J2","diameter_mm":250,"length_m":560,"material":"amiante-ciment","zone":"Grand Dakar","age_years":35,"risk":"high"},{"id":"PIPE-07","from":"J2","to":"P2","diameter_mm":300,"length_m":430,"material":"PVC","zone":"HLM"},{"id":"PIPE-08","from":"P2","to":"V2","diameter_mm":250,"length_m":510,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-09","from":"V2","to":"P3","diameter_mm":300,"length_m":890,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-10","from":"P3","to":"V3","diameter_mm":350,"length_m":750,"material":"PVC","zone":"Guédiawaye"},{"id":"PIPE-11","from":"V3","to":"R3","diameter_mm":400,"length_m":680,"material":"acier","zone":"Pikine"},{"id":"PIPE-12","from":"R3","to":"J3","diameter_mm":350,"length_m":520,"material":"PVC","zone":"Pikine"},{"id":"PIPE-13","from":"J3","to":"J2","diameter_mm":250,"length_m":1100,"material":"fonte","zone":"Pikine-HLM","age_years":28,"risk":"medium"}]}

const SENSORS = [{"sensor_id":"S1_acoustic","node_id":"J1","kind":"acoustic","name":"Acoustique Plateau","lat":14.6918,"lng":-17.4459,"zone":"Plateau","value":0.94,"unit":"score","status":"critique"},{"sensor_id":"S2_acoustic","node_id":"J2","kind":"acoustic","name":"Acoustique HLM","lat":14.7028,"lng":-17.4361,"zone":"HLM","value":0.12,"unit":"score","status":"normal"},{"sensor_id":"S3_acoustic","node_id":"J3","kind":"acoustic","name":"Acoustique Pikine","lat":14.7492,"lng":-17.3961,"zone":"Pikine","value":0.08,"unit":"score","status":"normal"},{"sensor_id":"S1_pressure","node_id":"R1","kind":"pressure","name":"Pression Château d'Eau","lat":14.694,"lng":-17.4438,"zone":"Plateau","value":3.4,"unit":"bar","status":"normal"},{"sensor_id":"S2_pressure","node_id":"P1","kind":"pressure","name":"Pression Fann","lat":14.6981,"lng":-17.4619,"zone":"Fann","value":2.1,"unit":"bar","status":"alerte"},{"sensor_id":"S3_pressure","node_id":"V2","kind":"pressure","name":"Pression Grand Dakar","lat":14.712,"lng":-17.4292,"zone":"Grand Dakar","value":1.8,"unit":"bar","status":"critique"},{"sensor_id":"S4_pressure","node_id":"P3","kind":"pressure","name":"Pression Parcelles","lat":14.7337,"lng":-17.412,"zone":"Parcelles Assainies","value":3.2,"unit":"bar","status":"normal"},{"sensor_id":"M1_flow","node_id":"P1","kind":"flow","name":"Débit Fann","lat":14.6975,"lng":-17.4625,"zone":"Fann","value":1360,"unit":"m³/h","status":"alerte"},{"sensor_id":"M2_flow","node_id":"P2","kind":"flow","name":"Débit HLM","lat":14.7086,"lng":-17.4404,"zone":"HLM","value":870,"unit":"m³/h","status":"normal"},{"sensor_id":"M3_flow","node_id":"P3","kind":"flow","name":"Débit Parcelles","lat":14.7331,"lng":-17.4126,"zone":"Parcelles Assainies","value":1050,"unit":"m³/h","status":"normal"},{"sensor_id":"Q1_quality","node_id":"R1","kind":"quality","name":"Qualité Réservoir Nord","lat":14.6934,"lng":-17.4443,"zone":"Plateau","value":7.2,"unit":"pH","status":"normal"},{"sensor_id":"Q2_quality","node_id":"R2","kind":"quality","name":"Qualité Réservoir Médina","lat":14.6888,"lng":-17.4514,"zone":"Médina","value":7.1,"unit":"pH","status":"normal"},{"sensor_id":"R1_level","node_id":"R1","kind":"level","name":"Niveau Château d'Eau","lat":14.6937,"lng":-17.4441,"zone":"Plateau","value":81.3,"unit":"%","status":"normal"},{"sensor_id":"R2_level","node_id":"R2","kind":"level","name":"Niveau Réservoir Médina","lat":14.6891,"lng":-17.4512,"zone":"Médina","value":74.2,"unit":"%","status":"normal"},{"sensor_id":"R3_level","node_id":"R3","kind":"level","name":"Niveau Réservoir Pikine","lat":14.7512,"lng":-17.3891,"zone":"Pikine","value":68.9,"unit":"%","status":"normal"},{"sensor_id":"P1_health","node_id":"P1","kind":"pump_health","name":"Santé Pompe Fann","lat":14.6979,"lng":-17.4622,"zone":"Fann","value":62,"unit":"°C","status":"critique"},{"sensor_id":"P2_health","node_id":"P2","kind":"pump_health","name":"Santé Pompe HLM","lat":14.7091,"lng":-17.4399,"zone":"HLM","value":45,"unit":"°C","status":"normal"}]

const ALERTS = [{"alert_id":"ALT-001","type":"Fuite","location":"Grand Dakar — J1-J2","severity":"Critique","probability":0.94,"lat":14.7023,"lng":-17.4412,"pipe_id":"PIPE-06","date":"2026-03-04 09:20","status":"En cours","estimated_loss_m3h":85,"description":"Vibrations acoustiques anormales sur canalisation amiante-ciment (35 ans)"},{"alert_id":"ALT-002","type":"Panne pompe","location":"Station Fann — P1","severity":"Critique","probability":0.91,"lat":14.6978,"lng":-17.4623,"pipe_id":null,"date":"2026-03-04 10:10","status":"En cours","estimated_loss_m3h":0,"description":"Surchauffe (62°C) et vibrations anormales"},{"alert_id":"ALT-003","type":"Débit anormal","location":"Canalisation Fann-Plateau","severity":"Alerte","probability":0.78,"lat":14.6955,"lng":-17.453,"pipe_id":"PIPE-01","date":"2026-03-04 09:45","status":"Analyse","estimated_loss_m3h":40,"description":"Débit 15% au-dessus de la normale"},{"alert_id":"ALT-004","type":"Pression basse","location":"Zone Grand Dakar","severity":"Alerte","probability":0.65,"lat":14.7123,"lng":-17.4289,"pipe_id":"PIPE-08","date":"2026-03-04 09:50","status":"Surveillance","estimated_loss_m3h":0,"description":"Pression en baisse continue depuis 2h"}]

const SENSOR_COLORS: Record<string, string> = {
  acoustic: "#a78bfa", pressure: "#38bdf8", flow: "#34d399",
  quality: "#22d3ee", level: "#fbbf24", pump_health: "#f87171",
}
const STATUS_COLORS: Record<string, string> = {
  normal: "#34d399", alerte: "#fbbf24", critique: "#f87171",
}
const SEVERITY_COLORS: Record<string, string> = {
  Critique: "#f87171", Alerte: "#fbbf24", Moyen: "#a78bfa", Faible: "#94a3b8",
}
const NODE_SYMBOLS: Record<string, string> = {
  reservoir: "▣", pump: "⚙", valve: "◈", junction: "◎",
}

declare global { interface Window { L: any } }

export function DakarWaterMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layersRef = useRef<Record<string, any>>({})
  const [mapReady, setMapReady] = useState(false)
  const [clock, setClock] = useState("")
  const [selectedSensor, setSelectedSensor] = useState<any>(null)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("fr-FR"))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Init Leaflet ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return

    const css = document.createElement("link")
    css.rel = "stylesheet"
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(css)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => {
      const L = window.L

      const map = L.map(mapContainerRef.current!, {
        center: [14.71, -17.44],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      })

      // Fond sombre CartoDB Dark Matter
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: "bottomright" }).addTo(map)
      mapRef.current = map
      setMapReady(true)
    }
    document.head.appendChild(script)

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  // ── Draw network once map is ready ────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const L = window.L
    const map = mapRef.current

    const nodeMap: Record<string, any> = {}
    NETWORK.nodes.forEach((n: any) => { nodeMap[n.id] = n })

    // ── Tuyaux ──
    NETWORK.pipes.forEach((pipe: any) => {
      const from = nodeMap[pipe.from]
      const to = nodeMap[pipe.to]
      if (!from || !to) return

      const isAlerted = ALERTS.some((a: any) => a.pipe_id === pipe.id)
      const color = pipe.risk === "high" ? "#f87171"
        : pipe.risk === "medium" ? "#fbbf24"
        : isAlerted ? "#fb923c"
        : "#22d3ee"
      const weight = pipe.diameter_mm ? Math.max(1.5, pipe.diameter_mm / 120) : 2

      const poly = L.polyline(
        [[from.lat, from.lng], [to.lat, to.lng]],
        {
          color,
          weight,
          opacity: 0.75,
          dashArray: pipe.risk === "high" ? "6 4" : pipe.risk === "medium" ? "10 4" : null,
        }
      ).addTo(map)

      poly.bindTooltip(
        `<div style="background:#0f172a;border:1px solid #22d3ee33;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;font-family:monospace">
          <b style="color:#22d3ee">${pipe.id}</b><br/>
          ${pipe.from} → ${pipe.to}<br/>
          ∅ ${pipe.diameter_mm}mm · ${pipe.material}
          ${pipe.age_years ? `<br/><span style="color:${color}">⚠ ${pipe.age_years} ans</span>` : ""}
        </div>`,
        { sticky: true, opacity: 1 }
      )
      layersRef.current[`pipe-${pipe.id}`] = poly
    })

    // ── Noeuds réseau ──
    NETWORK.nodes.forEach((node: any) => {
      const symbol = NODE_SYMBOLS[node.type] || "●"
      const nodeColor = node.type === "reservoir" ? "#38bdf8"
        : node.type === "pump" ? "#fbbf24"
        : node.type === "valve" ? "#a78bfa"
        : "#64748b"

      const icon = L.divIcon({
        html: `
          <div style="
            width:34px;height:34px;
            background:${nodeColor}22;
            border:2px solid ${nodeColor};
            border-radius:6px;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;color:${nodeColor};
            box-shadow:0 0 12px ${nodeColor}66;
            backdrop-filter:blur(4px);
          ">${symbol}</div>`,
        className: "",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })

      const marker = L.marker([node.lat, node.lng], { icon }).addTo(map)
      marker.bindTooltip(
        `<div style="background:#0f172a;border:1px solid ${nodeColor}44;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;font-family:monospace">
          <b style="color:${nodeColor}">${node.name}</b><br/>
          Zone: ${node.zone}
          ${node.capacity_m3 ? `<br/>Capacité: ${node.capacity_m3.toLocaleString()} m³` : ""}
          ${node.flow_m3h ? `<br/>Débit: ${node.flow_m3h} m³/h` : ""}
          ${node.open_pct !== undefined ? `<br/>Ouverture: ${node.open_pct}%` : ""}
        </div>`,
        { sticky: true, opacity: 1 }
      )
      layersRef.current[`node-${node.id}`] = marker
    })

    // ── Capteurs IoT ──
    SENSORS.forEach((s: any) => {
      const color = s.status === "critique" ? "#f87171"
        : s.status === "alerte" ? "#fbbf24"
        : SENSOR_COLORS[s.kind] || "#34d399"

      const isPulsing = s.status !== "normal"

      const icon = L.divIcon({
        html: `
          <div style="position:relative;width:20px;height:20px">
            ${isPulsing ? `
              <div style="
                position:absolute;inset:-6px;
                border-radius:50%;
                background:${color}33;
                animation:sensorPulse 1.8s ease-out infinite;
              "></div>
              <style>@keyframes sensorPulse{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.2);opacity:0}}</style>
            ` : ""}
            <div style="
              position:relative;
              width:20px;height:20px;
              border-radius:50%;
              background:${color}33;
              border:2px solid ${color};
              box-shadow:0 0 8px ${color}88;
            "></div>
          </div>`,
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const marker = L.marker([s.lat, s.lng], { icon }).addTo(map)
      marker.on("click", () => setSelectedSensor(s))
      marker.bindTooltip(
        `<div style="background:#0f172a;border:1px solid ${color}44;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;font-family:monospace">
          <b style="color:${color}">${s.name}</b><br/>
          ${s.value} ${s.unit} · ${s.zone}
        </div>`,
        { sticky: true, opacity: 1 }
      )
      layersRef.current[`sensor-${s.sensor_id}`] = marker
    })

    // ── Alertes ──
    ALERTS.forEach((alert: any) => {
      const color = SEVERITY_COLORS[alert.severity] || "#94a3b8"

      // Cercle de zone
      const circle = L.circle([alert.lat, alert.lng], {
        radius: alert.severity === "Critique" ? 200 : 130,
        color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: "4 4",
      }).addTo(map)
      layersRef.current[`alert-zone-${alert.alert_id}`] = circle

      // Marqueur alerte
      const alertIcon = L.divIcon({
        html: `
          <div style="position:relative;width:32px;height:32px">
            <div style="
              position:absolute;inset:0;
              border-radius:50%;
              border:2px solid ${color};
              background:${color}22;
              box-shadow:0 0 16px ${color}88;
              display:flex;align-items:center;justify-content:center;
              font-size:14px;
              animation:alertGlow 1.4s ease-in-out infinite alternate;
            ">⚠</div>
            <style>@keyframes alertGlow{from{box-shadow:0 0 8px ${color}66}to{box-shadow:0 0 22px ${color}}}</style>
          </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        zIndexOffset: 1000,
      })

      const marker = L.marker([alert.lat, alert.lng], { icon: alertIcon }).addTo(map)
      marker.on("click", () => setSelectedAlert(alert))
      marker.bindTooltip(
        `<div style="background:#0f172a;border:1px solid ${color}55;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:12px;font-family:monospace;max-width:220px">
          <b style="color:${color}">${alert.type} · ${alert.severity}</b><br/>
          ${alert.location}<br/>
          IA: <b>${(alert.probability * 100).toFixed(0)}%</b> · ${alert.status}
          ${alert.estimated_loss_m3h > 0 ? `<br/>Perte: <b>${alert.estimated_loss_m3h} m³/h</b>` : ""}
        </div>`,
        { sticky: true, opacity: 1 }
      )
      layersRef.current[`alert-${alert.alert_id}`] = marker
    })

  }, [mapReady])

  const critiques = ALERTS.filter((a: any) => a.severity === "Critique").length
  const alertes = ALERTS.filter((a: any) => a.severity === "Alerte").length
  const totalDebit = SENSORS.filter((s: any) => s.kind === "flow").reduce((acc: number, s: any) => acc + s.value, 0)

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }} className="relative h-full w-full">

      {/* ── Styles globaux ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap');
        .aqua-panel {
          background: rgba(2, 8, 23, 0.88);
          border: 1px solid rgba(34, 211, 238, 0.2);
          backdrop-filter: blur(12px);
          border-radius: 8px;
        }
        .aqua-panel-red {
          background: rgba(2, 8, 23, 0.88);
          border: 1px solid rgba(248, 113, 113, 0.3);
          backdrop-filter: blur(12px);
          border-radius: 8px;
        }
        .aqua-scroll::-webkit-scrollbar { width: 4px; }
        .aqua-scroll::-webkit-scrollbar-track { background: transparent; }
        .aqua-scroll::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); border-radius: 2px; }
        .leaflet-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        .leaflet-tooltip::before { display: none !important; }
      `}</style>

      {/* ── Carte ── */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "620px", borderRadius: "10px", overflow: "hidden" }}
      />


      {/* ── Panel gauche ── */}
      <div className="aqua-panel absolute left-4 flex flex-col gap-3 p-4" style={{ top: 16, width: 230, zIndex: 1000, maxHeight: "calc(100% - 100px)" }}>

        {/* Stats réseau */}
        <div>
          <p style={{ color: "#22d3ee", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 10 }}>RÉSEAU</p>
          {[
            { label: "Noeuds réseau", value: NETWORK.nodes.length },
            { label: "Débit total", value: `${Math.round(totalDebit)} m³/h` },
            { label: "Dernière synchro", value: clock },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(34,211,238,0.08)" }}>
              <span style={{ color: "#64748b", fontSize: 11 }}>{item.label}</span>
              <span style={{ color: "#e2e8f0", fontSize: 11, fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Capteurs IoT */}
        <div>
          <p style={{ color: "#22d3ee", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>CAPTEURS IoT</p>
          <div className="aqua-scroll" style={{ maxHeight: 170, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {SENSORS.filter((s: any) => ["pressure", "flow", "acoustic"].includes(s.kind)).map((s: any) => {
              const color = s.status === "critique" ? "#f87171" : s.status === "alerte" ? "#fbbf24" : "#34d399"
              return (
                <div
                  key={s.sensor_id}
                  onClick={() => {
                    setSelectedSensor(s)
                    mapRef.current?.setView([s.lat, s.lng], 16)
                  }}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "5px 8px", borderRadius: 5, cursor: "pointer",
                    background: selectedSensor?.sensor_id === s.sensor_id ? `${color}18` : "transparent",
                    border: `1px solid ${selectedSensor?.sensor_id === s.sensor_id ? color + "44" : "transparent"}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}` }} />
                    <span style={{ color: "#94a3b8", fontSize: 10, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  </div>
                  <span style={{ color, fontSize: 10, fontWeight: 700 }}>{s.value} {s.unit}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alertes actives */}
        <div>
          <p style={{ color: "#f87171", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>
            ALERTES ACTIVES &nbsp;
            <span style={{ background: "#f8717133", borderRadius: 3, padding: "1px 5px" }}>{ALERTS.length}</span>
          </p>
          <div className="aqua-scroll" style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
            {ALERTS.map((alert: any) => {
              const color = SEVERITY_COLORS[alert.severity]
              return (
                <div
                  key={alert.alert_id}
                  onClick={() => {
                    setSelectedAlert(alert)
                    mapRef.current?.setView([alert.lat, alert.lng], 16)
                  }}
                  style={{
                    padding: "7px 9px", borderRadius: 6, cursor: "pointer",
                    background: `${color}11`,
                    borderTop: selectedAlert?.alert_id === alert.alert_id ? `1px solid ${color}55` : `1px solid ${color}22`,
                    borderRight: selectedAlert?.alert_id === alert.alert_id ? `1px solid ${color}55` : `1px solid ${color}22`,
                    borderBottom: selectedAlert?.alert_id === alert.alert_id ? `1px solid ${color}55` : `1px solid ${color}22`,
                    borderLeft: `3px solid ${color}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color, fontSize: 11, fontWeight: 700 }}>{alert.type}</span>
                    <span style={{ color, fontSize: 10 }}>{(alert.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{alert.location}</div>
                  <div style={{ color: "#475569", fontSize: 10 }}>{alert.status}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── Panel droite — détail sélection ── */}
      {(selectedSensor || selectedAlert) && (
        <div className="aqua-panel absolute right-4 p-4" style={{ top: 76, width: 240, zIndex: 1000 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#22d3ee", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em" }}>
              {selectedSensor ? "CAPTEUR" : "ALERTE"}
            </span>
            <button
              onClick={() => { setSelectedSensor(null); setSelectedAlert(null) }}
              style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
            >✕</button>
          </div>

          {selectedSensor && (() => {
            const color = selectedSensor.status === "critique" ? "#f87171"
              : selectedSensor.status === "alerte" ? "#fbbf24"
              : SENSOR_COLORS[selectedSensor.kind] || "#34d399"
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color, fontSize: 13, fontWeight: 700 }}>{selectedSensor.name}</div>
                <div style={{ color: "#64748b", fontSize: 11 }}>{selectedSensor.zone} · {selectedSensor.kind}</div>
                <div style={{
                  background: `${color}18`, border: `1px solid ${color}44`,
                  borderRadius: 6, padding: "10px 14px", textAlign: "center"
                }}>
                  <div style={{ color, fontSize: 22, fontWeight: 700 }}>{selectedSensor.value}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{selectedSensor.unit}</div>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 4,
                  background: `${color}22`, border: `1px solid ${color}44`,
                  alignSelf: "flex-start"
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                  <span style={{ color, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{selectedSensor.status}</span>
                </div>
                <div style={{ color: "#475569", fontSize: 10 }}>ID: {selectedSensor.sensor_id}</div>
              </div>
            )
          })()}

          {selectedAlert && !selectedSensor && (() => {
            const color = SEVERITY_COLORS[selectedAlert.severity]
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color, fontSize: 13, fontWeight: 700 }}>⚠ {selectedAlert.type}</div>
                <div style={{ color: "#e2e8f0", fontSize: 12 }}>{selectedAlert.location}</div>
                <div style={{
                  background: `${color}18`, border: `1px solid ${color}44`,
                  borderRadius: 6, padding: "8px 12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#64748b", fontSize: 11 }}>Probabilité IA</span>
                    <span style={{ color, fontSize: 13, fontWeight: 700 }}>{(selectedAlert.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b", fontSize: 11 }}>Statut</span>
                    <span style={{ color: "#e2e8f0", fontSize: 11 }}>{selectedAlert.status}</span>
                  </div>
                  {selectedAlert.estimated_loss_m3h > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ color: "#64748b", fontSize: 11 }}>Perte estimée</span>
                      <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>{selectedAlert.estimated_loss_m3h} m³/h</span>
                    </div>
                  )}
                </div>
                <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5 }}>{selectedAlert.description}</div>
                <div style={{ color: "#475569", fontSize: 10 }}>{selectedAlert.date}</div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Légende bas droite ── */}
      <div className="aqua-panel absolute bottom-4 right-4 p-3" style={{ zIndex: 1000 }}>
        <p style={{ color: "#22d3ee", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>LÉGENDE</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { color: "#38bdf8", label: "Réservoir ▣" },
            { color: "#fbbf24", label: "Pompe ⚙" },
            { color: "#a78bfa", label: "Vanne ◈" },
            { color: "#f87171", label: "Tuyau risque élevé" },
            { color: "#fbbf24", label: "Tuyau risque moyen" },
            { color: "#22d3ee", label: "Tuyau normal" },
            { color: "#f87171", label: "⚠ Alerte critique" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ color: "#64748b", fontSize: 10 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
