"use client"

import { useEffect, useRef, useState } from "react"

// ── Même data que DakarWaterMap ───────────────────────────────────────────────
const NETWORK = {"nodes":[{"id":"R1","type":"reservoir","name":"Château d'Eau Plateau","lat":14.6937,"lng":-17.4441,"zone":"Plateau","capacity_m3":50000},{"id":"R2","type":"reservoir","name":"Réservoir Médina","lat":14.6891,"lng":-17.4512,"zone":"Médina","capacity_m3":35000},{"id":"R3","type":"reservoir","name":"Réservoir Pikine","lat":14.7512,"lng":-17.3891,"zone":"Pikine","capacity_m3":45000},{"id":"P1","type":"pump","name":"Station Pompage Fann","lat":14.6978,"lng":-17.4623,"zone":"Fann","flow_m3h":1200},{"id":"P2","type":"pump","name":"Station Pompage HLM","lat":14.7089,"lng":-17.4401,"zone":"HLM","flow_m3h":900},{"id":"P3","type":"pump","name":"Station Pompage Parcelles","lat":14.7334,"lng":-17.4123,"zone":"Parcelles Assainies","flow_m3h":1100},{"id":"V1","type":"valve","name":"Vanne Médina Nord","lat":14.6945,"lng":-17.4478,"zone":"Médina","open_pct":100},{"id":"V2","type":"valve","name":"Vanne Grand Dakar","lat":14.7123,"lng":-17.4289,"zone":"Grand Dakar","open_pct":75},{"id":"V3","type":"valve","name":"Vanne Guédiawaye","lat":14.7445,"lng":-17.4034,"zone":"Guédiawaye","open_pct":100},{"id":"J1","type":"junction","name":"Nœud Central Plateau","lat":14.6912,"lng":-17.4467,"zone":"Plateau"},{"id":"J2","type":"junction","name":"Nœud HLM-Médina","lat":14.7034,"lng":-17.4356,"zone":"HLM"},{"id":"J3","type":"junction","name":"Nœud Pikine Est","lat":14.7489,"lng":-17.3956,"zone":"Pikine"}],"pipes":[{"id":"PIPE-01","from":"R1","to":"P1","diameter_mm":400,"length_m":820,"material":"fonte","zone":"Plateau-Fann"},{"id":"PIPE-02","from":"P1","to":"J1","diameter_mm":350,"length_m":640,"material":"PVC","zone":"Plateau"},{"id":"PIPE-03","from":"J1","to":"V1","diameter_mm":300,"length_m":480,"material":"PVC","zone":"Médina"},{"id":"PIPE-04","from":"V1","to":"R2","diameter_mm":300,"length_m":390,"material":"fonte","zone":"Médina"},{"id":"PIPE-05","from":"R2","to":"J2","diameter_mm":350,"length_m":720,"material":"PVC","zone":"HLM"},{"id":"PIPE-06","from":"J1","to":"J2","diameter_mm":250,"length_m":560,"material":"amiante-ciment","zone":"Grand Dakar","age_years":35,"risk":"high"},{"id":"PIPE-07","from":"J2","to":"P2","diameter_mm":300,"length_m":430,"material":"PVC","zone":"HLM"},{"id":"PIPE-08","from":"P2","to":"V2","diameter_mm":250,"length_m":510,"material":"PVC","zone":"Grand Dakar"},{"id":"PIPE-09","from":"V2","to":"P3","diameter_mm":300,"length_m":890,"material":"fonte","zone":"Parcelles Assainies"},{"id":"PIPE-10","from":"P3","to":"V3","diameter_mm":350,"length_m":750,"material":"PVC","zone":"Guédiawaye"},{"id":"PIPE-11","from":"V3","to":"R3","diameter_mm":400,"length_m":680,"material":"acier","zone":"Pikine"},{"id":"PIPE-12","from":"R3","to":"J3","diameter_mm":350,"length_m":520,"material":"PVC","zone":"Pikine"},{"id":"PIPE-13","from":"J3","to":"J2","diameter_mm":250,"length_m":1100,"material":"fonte","zone":"Pikine-HLM","age_years":28,"risk":"medium"}]}

const ALERTS = [{"alert_id":"ALT-001","type":"Fuite","location":"Grand Dakar — J1-J2","severity":"Critique","probability":0.94,"lat":14.7023,"lng":-17.4412,"date":"2026-03-04 09:20","status":"En cours","description":"Une fuite a été détectée sur une canalisation de Grand Dakar. Les équipes sont en intervention."},{"alert_id":"ALT-002","type":"Panne pompe","location":"Station Fann — P1","severity":"Critique","probability":0.91,"lat":14.6978,"lng":-17.4623,"date":"2026-03-04 10:10","status":"En cours","description":"La station de pompage de Fann est en panne. Cela peut causer une baisse de pression dans le secteur."},{"alert_id":"ALT-003","type":"Débit anormal","location":"Fann-Plateau","severity":"Alerte","probability":0.78,"lat":14.6955,"lng":-17.453,"date":"2026-03-04 09:45","status":"Analyse","description":"Une anomalie de débit est détectée. Les équipes analysent la situation."},{"alert_id":"ALT-004","type":"Pression basse","location":"Zone Grand Dakar","severity":"Alerte","probability":0.65,"lat":14.7123,"lng":-17.4289,"date":"2026-03-04 09:50","status":"Surveillance","description":"La pression d'eau est basse dans ce secteur. Vous pouvez constater un faible débit au robinet."}]

// Zones avec statut eau potable pour le citoyen
const ZONE_STATUS: Record<string, { potable: boolean; message: string; color: string }> = {
  "Plateau":             { potable: true,  message: "Eau potable",      color: "#22c55e" },
  "Médina":              { potable: true,  message: "Eau potable",      color: "#22c55e" },
  "Fann":                { potable: false, message: "Légère anomalie",  color: "#f59e0b" },
  "HLM":                 { potable: true,  message: "Eau potable",      color: "#22c55e" },
  "Grand Dakar":         { potable: false, message: "Problème détecté", color: "#ef4444" },
  "Parcelles Assainies": { potable: true,  message: "Eau potable",      color: "#22c55e" },
  "Pikine":              { potable: true,  message: "Eau potable",      color: "#22c55e" },
  "Guédiawaye":          { potable: true,  message: "Eau potable",      color: "#22c55e" },
}

const SEVERITY_COLORS: Record<string, string> = {
  Critique: "#ef4444", Alerte: "#f59e0b", Moyen: "#a78bfa", Faible: "#94a3b8",
}

declare global { interface Window { L: any } }

export function DakarCitizenMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [clock, setClock] = useState("")
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

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
        zoom: 13,
        zoomControl: false,
      })
      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Tuiles CartoDB Dark Matter
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      // ── Tuyaux ────────────────────────────────────────────────────────────
      NETWORK.pipes.forEach((pipe: any) => {
        const fromNode = NETWORK.nodes.find((n: any) => n.id === pipe.from)
        const toNode = NETWORK.nodes.find((n: any) => n.id === pipe.to)
        if (!fromNode || !toNode) return

        const color = pipe.risk === "high" ? "#ef4444" : pipe.risk === "medium" ? "#f59e0b" : "#22d3ee"
        const dashArray = pipe.risk === "high" ? "6 4" : pipe.risk === "medium" ? "4 3" : ""

        L.polyline(
          [[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]],
          { color, weight: pipe.risk ? 3 : 2, opacity: 0.7, dashArray }
        ).addTo(map)
      })

      // ── Noeuds réseau (discrets, pas cliquables pour citoyen) ─────────────
      NETWORK.nodes.forEach((node: any) => {
        if (node.type === "junction") return // on cache les jonctions
        const colors: Record<string, string> = {
          reservoir: "#3b82f6", pump: "#22d3ee", valve: "#a78bfa",
        }
        const symbols: Record<string, string> = {
          reservoir: "▣", pump: "⚙", valve: "◈",
        }
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:28px; height:28px; border-radius:6px;
            background:${colors[node.type]}22;
            border:1.5px solid ${colors[node.type]}88;
            display:flex; align-items:center; justify-content:center;
            font-size:13px; color:${colors[node.type]};
          ">${symbols[node.type] ?? "●"}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        L.marker([node.lat, node.lng], { icon })
          .bindTooltip(`<div style="background:#0f172a;border:1px solid #22d3ee33;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:11px;">${node.name}<br/><span style="color:#64748b">${node.zone}</span></div>`, { permanent: false, direction: "top" })
          .addTo(map)
      })

      // ── Alertes — marqueurs cliquables ────────────────────────────────────
      ALERTS.forEach((alert: any) => {
        const color = SEVERITY_COLORS[alert.severity]
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative; width:36px; height:36px;">
              <div style="
                position:absolute; inset:0; border-radius:50%;
                background:${color}33; border:2px solid ${color};
                animation:citizen-pulse 2s infinite;
              "></div>
              <div style="
                position:absolute; inset:6px; border-radius:50%;
                background:${color}; display:flex; align-items:center; justify-content:center;
                font-size:13px; color:white; font-weight:bold;
              ">⚠</div>
            </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })
        L.marker([alert.lat, alert.lng], { icon })
          .on("click", () => setSelectedAlert((prev: any) => prev?.alert_id === alert.alert_id ? null : alert))
          .addTo(map)
      })

      setMapReady(true)
    }
    document.head.appendChild(script)
  }, [])

  const critiques = ALERTS.filter(a => a.severity === "Critique").length
  const alertes = ALERTS.filter(a => a.severity === "Alerte").length

  return (
    <div style={{ position: "relative", fontFamily: "system-ui, sans-serif", zIndex: 0 }}>
      <style>{`
        @keyframes citizen-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0.2; }
        }
        .citizen-scroll::-webkit-scrollbar { width: 3px; }
        .citizen-scroll::-webkit-scrollbar-track { background: transparent; }
        .citizen-scroll::-webkit-scrollbar-thumb { background: #22d3ee44; border-radius: 2px; }
        .citizen-panel {
          background: rgb(10,15,28);
          border: 1px solid rgba(34,211,238,0.15);
          border-radius: 10px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.6);
        }
        .leaflet-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        .leaflet-tooltip::before { display: none !important; }
        @media (max-width: 768px) {
          .lg-hide { display: flex !important; }
          [data-panel="left"] { display: none !important; }
          [data-panel="left"].panel-open { display: flex !important; top: 56px !important; width: calc(100% - 24px) !important; max-height: 70vh !important; }
        }
        @media (min-width: 769px) {
          .lg-hide { display: none !important; }
          [data-panel="left"] { display: flex !important; }
        }
      `}</style>

      {/* Carte — isolée dans son propre contexte d'empilement */}
      <div style={{ position: "relative", isolation: "isolate" }}>
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "600px", borderRadius: "12px", overflow: "hidden" }}
        />
      </div>

      {/* ── Bouton toggle mobile ── */}
      <button
        onClick={() => setPanelOpen(p => !p)}
        style={{
          position: "absolute", left: 12, top: 12, zIndex: 30,
          background: "rgb(10,15,28)", border: "1px solid rgba(34,211,238,0.3)",
          borderRadius: 8, padding: "8px 12px", cursor: "pointer",
          color: "#22d3ee", fontSize: 12, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 8,
          backdropFilter: "blur(12px)",
        }}
        className="lg-hide"
      >
        <span>{panelOpen ? "✕" : "☰"}</span>
        <span>{panelOpen ? "Fermer" : `Infos ${critiques > 0 ? "🔴" : alertes > 0 ? "⚠️" : "✅"}`}</span>
      </button>

      {/* ── Panel gauche — info citoyen ── */}
      <div className="citizen-panel" style={{
        position: "absolute", left: 12, top: 12, width: 220, zIndex: 30,
        padding: 14, display: "flex", flexDirection: "column", gap: 14,
        maxHeight: "calc(100% - 24px)", overflowY: "auto",
      }} data-panel="left" className={panelOpen ? "panel-open" : ""}>

        {/* Statut global */}
        <div>
          <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>ÉTAT DU RÉSEAU</p>
          <div style={{
            background: critiques > 0 ? "#ef444418" : alertes > 0 ? "#f59e0b18" : "#22c55e18",
            border: `1px solid ${critiques > 0 ? "#ef444444" : alertes > 0 ? "#f59e0b44" : "#22c55e44"}`,
            borderRadius: 8, padding: "10px 12px"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: critiques > 0 ? "#ef4444" : alertes > 0 ? "#f59e0b" : "#22c55e", marginBottom: 4 }}>
              {critiques > 0 ? "🔴 Problèmes en cours" : alertes > 0 ? "⚠️ Sous surveillance" : "✅ Fonctionnel"}
            </div>
            <div style={{ color: "#64748b", fontSize: 10, lineHeight: 1.4 }}>
              {critiques > 0
                ? `${critiques} incident${critiques > 1 ? "s" : ""} critique${critiques > 1 ? "s" : ""} — équipes mobilisées`
                : alertes > 0
                ? `${alertes} point${alertes > 1 ? "s" : ""} en surveillance`
                : "Aucune perturbation détectée"
              }
            </div>
          </div>
        </div>

        {/* Qualité par quartier */}
        <div>
          <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>EAU PAR QUARTIER</p>
          <div className="citizen-scroll" style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {Object.entries(ZONE_STATUS).map(([zone, info]) => (
              <div
                key={zone}
                onClick={() => setSelectedZone(selectedZone === zone ? null : zone)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 8px", borderRadius: 6, cursor: "pointer",
                  background: selectedZone === zone ? `${info.color}15` : "transparent",
                  border: `1px solid ${selectedZone === zone ? info.color + "44" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: info.color, flexShrink: 0 }} />
                  <span style={{ color: "#cbd5e1", fontSize: 11 }}>{zone}</span>
                </div>
                <span style={{ color: info.color, fontSize: 10, fontWeight: 600 }}>{info.potable ? "✓" : "!"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes — version citoyen */}
        <div>
          <p style={{ color: "#ef444499", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>
            INCIDENTS &nbsp;
            <span style={{ background: "#ef444422", borderRadius: 3, padding: "1px 5px" }}>{ALERTS.length}</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {ALERTS.map((alert: any) => {
              const color = SEVERITY_COLORS[alert.severity]
              return (
                <div
                  key={alert.alert_id}
                  onClick={() => {
                    setSelectedAlert((prev: any) => prev?.alert_id === alert.alert_id ? null : alert)
                    mapRef.current?.setView([alert.lat, alert.lng], 15)
                  }}
                  style={{
                    padding: "7px 9px", borderRadius: 6, cursor: "pointer",
                    background: `${color}11`,
                    borderLeft: `3px solid ${color}`,
                    borderTop: `1px solid ${color}22`,
                    borderRight: `1px solid ${color}22`,
                    borderBottom: `1px solid ${color}22`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ color, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{alert.type}</div>
                  <div style={{ color: "#64748b", fontSize: 10 }}>{alert.location}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Heure */}
        <div style={{ color: "#334155", fontSize: 10, textAlign: "center", borderTop: "1px solid rgba(34,211,238,0.08)", paddingTop: 8 }}>
          Mis à jour {clock}
        </div>
      </div>

      {/* ── Panel droite — détail incident ou quartier ── */}
      {(selectedAlert || selectedZone) && (
        <div className="citizen-panel" style={{
          position: "absolute", right: 12, top: 12, width: 240, zIndex: 30, padding: 14
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}>
              {selectedAlert ? "INCIDENT" : "MON QUARTIER"}
            </span>
            <button
              onClick={() => { setSelectedAlert(null); setSelectedZone(null) }}
              style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
            >✕</button>
          </div>

          {/* Détail incident — version citoyen */}
          {selectedAlert && (() => {
            const color = SEVERITY_COLORS[selectedAlert.severity]
            const isCritique = selectedAlert.severity === "Critique"
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{
                  background: `${color}18`, border: `1px solid ${color}44`,
                  borderRadius: 8, padding: "10px 12px"
                }}>
                  <div style={{ color, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    {isCritique ? "🔴" : "⚠️"} {selectedAlert.type}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>{selectedAlert.location}</div>
                </div>

                {/* Message humain */}
                <div style={{
                  background: "rgba(255,255,255,0.03)", borderRadius: 6,
                  padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)"
                }}>
                  <p style={{ color: "#e2e8f0", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    {selectedAlert.description}
                  </p>
                </div>

                {/* Statut */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "#64748b" }}>Statut</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{selectedAlert.status}</span>
                </div>

                {/* Conseil citoyen */}
                {isCritique && (
                  <div style={{
                    background: "#f59e0b11", border: "1px solid #f59e0b33",
                    borderRadius: 6, padding: "8px 10px"
                  }}>
                    <p style={{ color: "#f59e0b", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                      💡 Si vous êtes dans ce secteur, conservez de l'eau en bouteille par précaution.
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Détail quartier */}
          {selectedZone && !selectedAlert && (() => {
            const info = ZONE_STATUS[selectedZone]
            const zoneAlerts = ALERTS.filter(a => a.location.includes(selectedZone))
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{
                  background: `${info.color}18`, border: `1px solid ${info.color}44`,
                  borderRadius: 8, padding: "12px 14px", textAlign: "center"
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{info.potable ? "✅" : "⚠️"}</div>
                  <div style={{ color: info.color, fontSize: 14, fontWeight: 700 }}>{info.message}</div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{selectedZone}</div>
                </div>

                {info.potable ? (
                  <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    L'eau du robinet est conforme aux normes dans votre quartier. Aucune restriction n'est en vigueur.
                  </p>
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    Une anomalie a été détectée dans votre secteur. Les équipes techniques sont informées et interviennent.
                  </p>
                )}

                {zoneAlerts.length > 0 && (
                  <div>
                    <p style={{ color: "#64748b", fontSize: 10, marginBottom: 6 }}>Incidents en cours :</p>
                    {zoneAlerts.map(a => (
                      <div key={a.alert_id} style={{
                        padding: "6px 8px", borderRadius: 5,
                        background: `${SEVERITY_COLORS[a.severity]}11`,
                        borderLeft: `3px solid ${SEVERITY_COLORS[a.severity]}`,
                        marginBottom: 4, color: "#94a3b8", fontSize: 11
                      }}>
                        {a.type} — {a.status}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Légende bas droite ── */}
      <div className="citizen-panel" style={{
        position: "absolute", bottom: 40, right: 12, zIndex: 30, padding: "10px 14px"
      }}>
        <p style={{ color: "#94a3b8", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>LÉGENDE</p>
        {[
          { color: "#22c55e", label: "Eau potable" },
          { color: "#f59e0b", label: "Sous surveillance" },
          { color: "#ef4444", label: "Incident en cours" },
          { color: "#ef4444", label: "Canalisation à risque" },
          { color: "#f59e0b", label: "Canalisation à surveiller" },
          { color: "#22d3ee", label: "Réseau normal" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
            <span style={{ color: "#64748b", fontSize: 10 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
