"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// ── Données réseau ──────────────────────────────────────────────────────────
const NODES = [{"id":"R1","type":"reservoir","name":"Château d'Eau Plateau","lat":14.693,"lng":-17.445,"zone":"Plateau","capacity_m3":50000},{"id":"R2","type":"reservoir","name":"Réservoir Médina","lat":14.688,"lng":-17.46,"zone":"Médina","capacity_m3":35000},{"id":"R3","type":"reservoir","name":"Réservoir Pikine","lat":14.752,"lng":-17.388,"zone":"Pikine","capacity_m3":45000},{"id":"R4","type":"reservoir","name":"Réservoir Parcelles","lat":14.733,"lng":-17.412,"zone":"Parcelles Assainies","capacity_m3":30000},{"id":"P1","type":"pump","name":"Station Pompage Fann","lat":14.7,"lng":-17.463,"zone":"Fann","flow_m3h":1200},{"id":"P2","type":"pump","name":"Station Pompage HLM","lat":14.71,"lng":-17.443,"zone":"HLM","flow_m3h":900},{"id":"P3","type":"pump","name":"Station Pompage Parcelles","lat":14.73,"lng":-17.415,"zone":"Parcelles Assainies","flow_m3h":1100},{"id":"P4","type":"pump","name":"Station Pompage Guédiawaye","lat":14.745,"lng":-17.407,"zone":"Guédiawaye","flow_m3h":800}]
const INTER_NODES = [{"id":"N1","zone":"Plateau","lat":14.694067,"lng":-17.454375},{"id":"N2","zone":"Plateau","lat":14.686051,"lng":-17.44942},{"id":"N3","zone":"Plateau","lat":14.696202,"lng":-17.438083},{"id":"N5","zone":"Plateau","lat":14.689282,"lng":-17.454255},{"id":"N11","zone":"Médina","lat":14.696116,"lng":-17.453132},{"id":"N12","zone":"Médina","lat":14.686805,"lng":-17.462357},{"id":"N21","zone":"Fann","lat":14.706091,"lng":-17.471221},{"id":"N22","zone":"Fann","lat":14.696558,"lng":-17.46708},{"id":"N29","zone":"HLM","lat":14.70308,"lng":-17.43823},{"id":"N30","zone":"HLM","lat":14.702941,"lng":-17.446273},{"id":"N37","zone":"Grand Dakar","lat":14.721775,"lng":-17.436504},{"id":"N38","zone":"Grand Dakar","lat":14.717798,"lng":-17.434318},{"id":"N45","zone":"Parcelles Assainies","lat":14.722,"lng":-17.426775},{"id":"N46","zone":"Parcelles Assainies","lat":14.722412,"lng":-17.411686},{"id":"N53","zone":"Pikine","lat":14.744404,"lng":-17.385771},{"id":"N54","zone":"Pikine","lat":14.740677,"lng":-17.391957},{"id":"N63","zone":"Guédiawaye","lat":14.734013,"lng":-17.411896},{"id":"N64","zone":"Guédiawaye","lat":14.734428,"lng":-17.396773},{"id":"N71","zone":"Rufisque","lat":14.719506,"lng":-17.368506},{"id":"N72","zone":"Rufisque","lat":14.715301,"lng":-17.358827}]
const PIPES = [{"id":"PIPE-01","from":"R1","to":"P1","diameter_mm":400,"material":"fonte"},{"id":"PIPE-02","from":"R1","to":"N1","diameter_mm":350,"material":"PVC"},{"id":"PIPE-03","from":"P1","to":"N1","diameter_mm":300,"material":"PVC"},{"id":"PIPE-04","from":"N1","to":"N11","diameter_mm":300,"material":"PVC"},{"id":"PIPE-05","from":"N11","to":"R2","diameter_mm":300,"material":"fonte"},{"id":"PIPE-06","from":"R2","to":"N29","diameter_mm":350,"material":"PVC"},{"id":"PIPE-07","from":"N1","to":"N29","diameter_mm":250,"material":"amiante-ciment","age_years":35,"risk":"high"},{"id":"PIPE-08","from":"N29","to":"P2","diameter_mm":300,"material":"PVC"},{"id":"PIPE-09","from":"P2","to":"N37","diameter_mm":250,"material":"PVC"},{"id":"PIPE-10","from":"N37","to":"N45","diameter_mm":300,"material":"fonte"},{"id":"PIPE-11","from":"N45","to":"P3","diameter_mm":300,"material":"PVC"},{"id":"PIPE-12","from":"P3","to":"R4","diameter_mm":350,"material":"PVC"},{"id":"PIPE-13","from":"R4","to":"N63","diameter_mm":300,"material":"acier"},{"id":"PIPE-14","from":"N63","to":"P4","diameter_mm":300,"material":"PVC"},{"id":"PIPE-15","from":"P4","to":"R3","diameter_mm":400,"material":"acier"},{"id":"PIPE-16","from":"R3","to":"N53","diameter_mm":350,"material":"PVC"},{"id":"PIPE-17","from":"N30","to":"N37","diameter_mm":200,"material":"PVC"},{"id":"PIPE-18","from":"N46","to":"N63","diameter_mm":200,"material":"PVC"},{"id":"PIPE-19","from":"N53","to":"N71","diameter_mm":200,"material":"fonte","age_years":22,"risk":"medium"}]
const ALERTS = [{"alert_id":"ALT-001","type":"Fuite détectée","location":"Grand Dakar","severity":"Critique","lat":14.712,"lng":-17.438,"date":"2026-03-11 09:20","status":"Équipes en intervention","description":"Une fuite importante a été détectée dans votre secteur. Conservez de l'eau en bouteille par précaution."},{"alert_id":"ALT-002","type":"Panne pompe","location":"Quartier Fann","severity":"Critique","lat":14.7,"lng":-17.463,"date":"2026-03-11 10:10","status":"Intervention en cours","description":"La station de pompage est en panne. Une baisse de pression est possible à votre robinet."},{"alert_id":"ALT-003","type":"Débit anormal","location":"Fann — Plateau","severity":"Alerte","lat":14.696,"lng":-17.454,"date":"2026-03-11 09:45","status":"En cours d'analyse","description":"Nos équipes analysent une anomalie de débit. Situation sous contrôle."},{"alert_id":"ALT-004","type":"Pression basse","location":"Médina","severity":"Alerte","lat":14.693,"lng":-17.456,"date":"2026-03-11 09:50","status":"Surveillance active","description":"Pression réduite dans ce secteur. Vous pouvez constater un faible débit au robinet."}]

// Zones avec centres et statuts qualité
const ZONES: Record<string, { lat: number; lng: number; potable: boolean; message: string; color: string; fillColor: string }> = {
  "Plateau":             { lat: 14.690, lng: -17.448, potable: true,  message: "Eau conforme",    color: "#34d399", fillColor: "#34d39922" },
  "Médina":              { lat: 14.690, lng: -17.458, potable: false, message: "Surveillance",    color: "#fbbf24", fillColor: "#fbbf2415" },
  "Fann":                { lat: 14.700, lng: -17.466, potable: false, message: "Anomalie",        color: "#fbbf24", fillColor: "#fbbf2415" },
  "HLM":                 { lat: 14.710, lng: -17.442, potable: true,  message: "Eau conforme",    color: "#34d399", fillColor: "#34d39922" },
  "Grand Dakar":         { lat: 14.716, lng: -17.430, potable: false, message: "Incident",        color: "#f87171", fillColor: "#f8717115" },
  "Parcelles Assainies": { lat: 14.730, lng: -17.415, potable: true,  message: "Eau conforme",    color: "#34d399", fillColor: "#34d39922" },
  "Pikine":              { lat: 14.752, lng: -17.390, potable: true,  message: "Eau conforme",    color: "#34d399", fillColor: "#34d39922" },
  "Guédiawaye":          { lat: 14.744, lng: -17.408, potable: true,  message: "Eau conforme",    color: "#34d399", fillColor: "#34d39922" },
  "Rufisque":            { lat: 14.718, lng: -17.370, potable: true,  message: "Eau conforme",    color: "#34d399", fillColor: "#34d39922" },
}

const SEVERITY_COLOR: Record<string, string> = { Critique: "#f87171", Alerte: "#fbbf24", Moyen: "#a78bfa", Faible: "#94a3b8" }
const STORAGE_KEY = "aqp_citoyen_quartier"

// ── Composant ──────────────────────────────────────────────────────────────
export function DakarCitizenMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const leafletRef      = useRef<any>(null)
  const [mapReady,       setMapReady]       = useState(false)
  const [clock,          setClock]          = useState("")
  const [selectedAlert,  setSelectedAlert]  = useState<any>(null)
  const [selectedZone,   setSelectedZone]   = useState<string | null>(null)
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [isMobile,       setIsMobile]       = useState(false)
  // Mobile: "closed" = mini bar 64px visible | "open" = full drawer
  const [drawerState,    setDrawerState]    = useState<"closed" | "open">("closed")
  const [currentQuartier, setCurrentQuartier] = useState("Plateau")
  const [locating,       setLocating]       = useState(false)

  // ── Init responsive ────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 1024
      setIsMobile(m)
      if (!m) setSidebarOpen(true)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ── Horloge ───────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }))
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  // ── Quartier persisté ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && ZONES[saved]) {
        setCurrentQuartier(saved)
        setSelectedZone(saved)
      }
    } catch {}
  }, [])

  // ── Resize map on sidebar toggle ──────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 300)
  }, [sidebarOpen])

  // ── Init Leaflet ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return
    import("leaflet").then(lm => {
      const L = lm.default ?? lm
      if (mapRef.current || !mapContainerRef.current) return
      const map = L.map(mapContainerRef.current, {
        center: [14.715, -17.430], zoom: 12,
        zoomControl: false, attributionControl: false,
        // Meilleure expérience tactile
        tap: true, tapTolerance: 15,
      })
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 19 }).addTo(map)
      L.control.zoom({ position: "bottomright" }).addTo(map)
      leafletRef.current = L
      mapRef.current = map
      setMapReady(true)
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  // ── Dessin des couches ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const L = leafletRef.current; const map = mapRef.current
    if (!L || !map) return

    const nm: Record<string, any> = {}
    NODES.forEach(n => nm[n.id] = n)
    INTER_NODES.forEach(n => nm[n.id] = n)

    // 1. Zones colorées (grands cercles semi-transparents)
    Object.entries(ZONES).forEach(([zone, info]) => {
      const circle = L.circle([info.lat, info.lng], {
        radius: 600, color: info.color, fillColor: info.fillColor,
        fillOpacity: 1, weight: 1.5, opacity: 0.6, dashArray: "4 3",
      }).addTo(map)
      circle.on("click", () => {
        setSelectedZone(zone)
        setSelectedAlert(null)
        setCurrentQuartier(zone)
        try { localStorage.setItem(STORAGE_KEY, zone) } catch {}
        if (window.innerWidth < 1024) setDrawerState("open")
        map.setView([info.lat, info.lng], 14, { animate: true })
      })
      // Label zone flottant
      L.marker([info.lat, info.lng], {
        icon: L.divIcon({
          html: `<div style="background:transparent;pointer-events:none">
            <div style="background:${info.color}22;border:1px solid ${info.color}55;border-radius:20px;padding:2px 8px;white-space:nowrap;font-size:9px;font-weight:700;color:${info.color};letter-spacing:0.05em">${info.message}</div>
          </div>`,
          className: "", iconSize: [0, 0], iconAnchor: [0, -10],
        }),
        interactive: false,
      }).addTo(map)
    })

    // 2. Conduites simplifiées
    PIPES.forEach(p => {
      const f = nm[p.from]; const t = nm[p.to]
      if (!f || !t) return
      const c = (p as any).risk === "high" ? "#f8717166" : (p as any).risk === "medium" ? "#fbbf2455" : "#22d3ee33"
      L.polyline([[f.lat, f.lng], [t.lat, t.lng]], { color: c, weight: 1.5, opacity: 0.7 }).addTo(map)
    })

    // 3. Réservoirs
    NODES.filter(n => n.type === "reservoir").forEach(node => {
      const icon = L.divIcon({
        html: `<div style="width:26px;height:26px;background:#38bdf818;border:2px solid #38bdf8;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 8px #38bdf855">💧</div>`,
        className: "", iconSize: [26, 26], iconAnchor: [13, 13],
      })
      L.marker([node.lat, node.lng], { icon }).addTo(map)
        .bindTooltip(`<div style="background:#0f172a;border:1px solid #38bdf833;color:#e2e8f0;padding:5px 9px;border-radius:6px;font-size:11px">${node.name}</div>`, { sticky: true, opacity: 1 })
    })

    // 4. Alertes incidents (marqueurs plus grands sur mobile)
    ALERTS.forEach(alert => {
      const c = SEVERITY_COLOR[alert.severity] ?? "#94a3b8"
      const size = window.innerWidth < 1024 ? 38 : 30
      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${c};background:${c}22;box-shadow:0 0 12px ${c}77;display:flex;align-items:center;justify-content:center;font-size:${size * 0.4}px">⚠</div>`,
        className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2], zIndexOffset: 1000,
      })
      L.circle([alert.lat, alert.lng], { radius: 180, color: c, fillColor: c, fillOpacity: 0.06, weight: 1 }).addTo(map)
      L.marker([alert.lat, alert.lng], { icon }).addTo(map)
        .on("click", () => {
          setSelectedAlert(alert)
          setSelectedZone(null)
          if (window.innerWidth < 1024) setDrawerState("open")
          map.setView([alert.lat, alert.lng], 15, { animate: true })
        })
    })
  }, [mapReady])

  // ── GPS ────────────────────────────────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!mapRef.current) return
    setLocating(true)
    mapRef.current.locate({ setView: true, maxZoom: 15 })
    mapRef.current.once("locationfound", (e: any) => {
      setLocating(false)
      // Trouver la zone la plus proche
      let closestZone = "Plateau"
      let minDist = Infinity
      Object.entries(ZONES).forEach(([zone, info]) => {
        const d = Math.hypot(e.latlng.lat - info.lat, e.latlng.lng - info.lng)
        if (d < minDist) { minDist = d; closestZone = zone }
      })
      setSelectedZone(closestZone)
      setCurrentQuartier(closestZone)
      if (isMobile) setDrawerState("open")
    })
    mapRef.current.once("locationerror", () => setLocating(false))
  }, [isMobile])

  const handleZoneSelect = (zone: string) => {
    setSelectedZone(zone)
    setSelectedAlert(null)
    setCurrentQuartier(zone)
    try { localStorage.setItem(STORAGE_KEY, zone) } catch {}
    if (mapRef.current && ZONES[zone]) {
      mapRef.current.setView([ZONES[zone].lat, ZONES[zone].lng], 14, { animate: true })
    }
    if (isMobile) setDrawerState("open")
  }

  const SW = 256
  const currentZoneInfo = selectedZone ? ZONES[selectedZone] : ZONES[currentQuartier]
  const currentZoneName = selectedZone ?? currentQuartier

  return (
    <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", position: "relative", width: "100%", height: "100%", display: "flex" }}>
      <style>{`
        .cz-sb::-webkit-scrollbar{width:3px}
        .cz-sb::-webkit-scrollbar-thumb{background:rgba(34,211,238,.25);border-radius:2px}
        .leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important}
        .leaflet-tooltip::before{display:none!important}
        .cz-zone-btn:active{transform:scale(0.97)}
      `}</style>

      {/* ══ DESKTOP SIDEBAR ══ */}
      {!isMobile && (
        <div style={{
          width: sidebarOpen ? SW : 0, minWidth: sidebarOpen ? SW : 0, height: "100%",
          overflow: "hidden", transition: "width .25s ease,min-width .25s ease",
          background: "#020817", borderRight: "1px solid rgba(34,211,238,.22)",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          <div className="cz-sb" style={{ flex: 1, overflowY: "auto", width: SW, opacity: sidebarOpen ? 1 : 0, transition: "opacity .2s", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ color: "#22d3ee", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", margin: 0 }}>AQUAPULSE — CITOYEN</p>

            {/* Zones qualité */}
            <div>
              <p style={{ color: "#22d3ee", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>QUALITÉ PAR QUARTIER</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(ZONES).map(([zone, info]) => (
                  <div key={zone} onClick={() => handleZoneSelect(zone)} className="cz-zone-btn"
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "6px 9px", borderRadius: 7, cursor: "pointer",
                      background: selectedZone === zone ? `${info.color}18` : "transparent",
                      border: `1px solid ${selectedZone === zone ? info.color + "44" : "transparent"}`,
                      transition: "all .15s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color, boxShadow: `0 0 5px ${info.color}88`, flexShrink: 0 }} />
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>{zone}</span>
                    </div>
                    <span style={{ color: info.color, fontSize: 10, fontWeight: 700 }}>{info.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incidents */}
            <div>
              <p style={{ color: "#f87171", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>
                INCIDENTS <span style={{ background: "#f8717133", borderRadius: 3, padding: "1px 5px" }}>{ALERTS.length}</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {ALERTS.map(a => {
                  const c = SEVERITY_COLOR[a.severity] ?? "#94a3b8"
                  return (
                    <div key={a.alert_id} onClick={() => { setSelectedAlert(a); setSelectedZone(null); mapRef.current?.setView([a.lat, a.lng], 15, { animate: true }) }} className="cz-zone-btn"
                      style={{ padding: "7px 9px", borderRadius: 6, cursor: "pointer", background: selectedAlert?.alert_id === a.alert_id ? `${c}10` : "transparent", borderLeft: `3px solid ${c}`, borderTop: `1px solid ${c}22`, borderRight: `1px solid ${c}22`, borderBottom: `1px solid ${c}22`, transition: "all .15s" }}>
                      <div style={{ color: c, fontSize: 11, fontWeight: 700 }}>{a.type}</div>
                      <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{a.location}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Légende */}
            <div style={{ borderTop: "1px solid rgba(34,211,238,.08)", paddingTop: 10 }}>
              <p style={{ color: "#22d3ee", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>LÉGENDE</p>
              {[
                { c: "#34d399", l: "Eau conforme" }, { c: "#fbbf24", l: "Sous surveillance" },
                { c: "#f87171", l: "Incident / Alerte" }, { c: "#22d3ee", l: "Réseau eau" },
              ].map(x => (
                <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c, flexShrink: 0 }} />
                  <span style={{ color: "#64748b", fontSize: 10 }}>{x.l}</span>
                </div>
              ))}
            </div>

            <div style={{ color: "#334155", fontSize: 10, textAlign: "center" }}>Mis à jour {clock}</div>
          </div>
        </div>
      )}

      {/* ══ ZONE MAP ══ */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>

        {/* Toggle sidebar desktop */}
        {!isMobile && (
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 1000,
            width: 22, height: 52, background: "#020817", border: "1px solid rgba(34,211,238,.35)",
            borderLeft: "none", borderRadius: "0 8px 8px 0", cursor: "pointer",
            color: "#22d3ee", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "3px 0 12px rgba(0,0,0,0.5)",
          }}>{sidebarOpen ? "‹" : "›"}</button>
        )}

        {/* Bouton GPS — mobile en haut à droite, desktop en bas à gauche */}
        <button onClick={handleLocate}
          style={{
            position: "absolute",
            top: isMobile ? 12 : "auto",
            bottom: isMobile ? "auto" : 60,
            right: isMobile ? 12 : "auto",
            left: isMobile ? "auto" : 12,
            zIndex: 2000,
            background: "#020817", border: "1px solid rgba(34,211,238,.5)", borderRadius: 10,
            padding: "10px 12px", color: "#22d3ee", fontSize: 12, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", gap: 6,
            transition: "all .15s",
          }}>
          {locating ? "⏳" : "📍"} {isMobile ? "" : "Ma position"}
        </button>

        {/* Map */}
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Panneau détail DESKTOP */}
        {!isMobile && (selectedAlert || selectedZone) && (
          <div style={{ position: "absolute", right: 12, top: 12, width: 235, zIndex: 1000, background: "#020817", border: "1px solid rgba(34,211,238,.22)", borderRadius: 12, padding: 14, maxHeight: "calc(100% - 24px)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: "#22d3ee", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em" }}>{selectedAlert ? "INCIDENT" : "MON QUARTIER"}</span>
              <button onClick={() => { setSelectedAlert(null); setSelectedZone(null) }} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>
            <DetailPanel alert={selectedAlert} zone={selectedZone} />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE — BOTTOM SHEET redesigné
          Structure :
          - Mini bar persistante (64px) toujours visible au-dessus de la nav
          - Swipe / tap → s'ouvre en drawer 62vh
      ══════════════════════════════════════════════ */}
      {isMobile && (
        <>
          {/* Overlay quand ouvert */}
          {drawerState === "open" && (
            <div onClick={() => setDrawerState("closed")}
              style={{ position: "absolute", inset: 0, zIndex: 29, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }} />
          )}

          {/* Sheet */}
          <div style={{
            position: "absolute",
            bottom: "4rem",  // au-dessus de la bottom nav (64px)
            left: 0, right: 0,
            zIndex: 30,
            display: "flex", flexDirection: "column",
            background: "#020817",
            borderRadius: "18px 18px 0 0",
            border: "1px solid rgba(34,211,238,.2)",
            borderBottom: "none",
            boxShadow: "0 -6px 32px rgba(0,0,0,0.5)",
            // Hauteur dynamique
            maxHeight: drawerState === "open" ? "62vh" : "72px",
            transition: "max-height .35s cubic-bezier(0.32,0.72,0,1)",
            overflow: "hidden",
          }}>

            {/* ── Mini bar (toujours visible) ── */}
            <div onClick={() => setDrawerState(s => s === "closed" ? "open" : "closed")}
              style={{ padding: "10px 16px 8px", cursor: "pointer", flexShrink: 0 }}>
              {/* Handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(34,211,238,.3)", margin: "0 auto 8px" }} />
              {/* Status de la zone actuelle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: currentZoneInfo?.color ?? "#22d3ee", boxShadow: `0 0 6px ${currentZoneInfo?.color ?? "#22d3ee"}99`, animation: !currentZoneInfo?.potable ? "pulse 2s infinite" : "none" }} />
                  <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>{currentZoneName}</span>
                  <span style={{ color: currentZoneInfo?.color ?? "#22d3ee", fontSize: 11, fontWeight: 600 }}>{currentZoneInfo?.message}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {ALERTS.length > 0 && (
                    <span style={{ background: "#f8717133", color: "#f87171", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>
                      {ALERTS.length} alertes
                    </span>
                  )}
                  <span style={{ color: "#22d3ee", fontSize: 12 }}>{drawerState === "closed" ? "▲" : "▼"}</span>
                </div>
              </div>
            </div>

            {/* ── Contenu drawer ── */}
            <div className="cz-sb" style={{ flex: 1, overflowY: "auto", opacity: drawerState === "open" ? 1 : 0, transition: "opacity .2s .1s" }}>

              {/* Détail si sélection */}
              {(selectedAlert || selectedZone) ? (
                <div style={{ padding: "4px 16px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ color: "#22d3ee", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em" }}>{selectedAlert ? "INCIDENT" : "QUARTIER"}</span>
                    <button onClick={() => { setSelectedAlert(null); setSelectedZone(null) }}
                      style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
                  </div>
                  <DetailPanel alert={selectedAlert} zone={selectedZone} />
                </div>
              ) : (
                /* Menu complet */
                <div style={{ padding: "4px 14px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Zones */}
                  <div>
                    <p style={{ color: "#22d3ee", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>QUALITÉ PAR QUARTIER</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {Object.entries(ZONES).map(([zone, info]) => (
                        <div key={zone} onClick={() => handleZoneSelect(zone)} className="cz-zone-btn"
                          style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                            background: selectedZone === zone ? `${info.color}18` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${selectedZone === zone ? info.color + "55" : "rgba(255,255,255,0.06)"}`,
                            transition: "all .15s",
                          }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color, flexShrink: 0, boxShadow: `0 0 4px ${info.color}99` }} />
                          <div style={{ overflow: "hidden" }}>
                            <div style={{ color: "#e2e8f0", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{zone}</div>
                            <div style={{ color: info.color, fontSize: 10 }}>{info.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Incidents */}
                  <div>
                    <p style={{ color: "#f87171", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>
                      INCIDENTS ACTIFS <span style={{ background: "#f8717133", borderRadius: 3, padding: "1px 5px" }}>{ALERTS.length}</span>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {ALERTS.map(a => {
                        const c = SEVERITY_COLOR[a.severity] ?? "#94a3b8"
                        return (
                          <div key={a.alert_id} onClick={() => { setSelectedAlert(a); setSelectedZone(null); mapRef.current?.setView([a.lat, a.lng], 15, { animate: true }) }} className="cz-zone-btn"
                            style={{ padding: "9px 11px", borderRadius: 10, cursor: "pointer", borderLeft: `3px solid ${c}`, border: `1px solid ${c}22`, borderLeft: `3px solid ${c}`, background: `${c}09`, transition: "all .15s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <div style={{ color: c, fontSize: 12, fontWeight: 700 }}>{a.type}</div>
                                <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{a.location}</div>
                              </div>
                              <span style={{ background: `${c}22`, color: c, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, flexShrink: 0 }}>{a.severity}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ color: "#334155", fontSize: 10, textAlign: "center", borderTop: "1px solid rgba(34,211,238,.08)", paddingTop: 8 }}>
                    Mis à jour {clock}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Style keyframes pour le pulse */}
          <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }`}</style>
        </>
      )}
    </div>
  )
}

// ── Panel détail (partagé desktop/mobile) ─────────────────────────────────
function DetailPanel({ alert, zone }: { alert: any; zone: string | null }) {
  if (alert) {
    const c = SEVERITY_COLOR[alert.severity] ?? "#94a3b8"
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: `${c}12`, border: `1px solid ${c}44`, borderRadius: 9, padding: "10px 12px" }}>
          <div style={{ color: c, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
            {alert.severity === "Critique" ? "🔴" : "⚠️"} {alert.type}
          </div>
          <div style={{ color: "#64748b", fontSize: 11 }}>{alert.location}</div>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.65, margin: 0 }}>{alert.description}</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
          <span style={{ color: "#475569" }}>Statut</span>
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{alert.status}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
          <span style={{ color: "#475569" }}>Signalé le</span>
          <span style={{ color: "#e2e8f0" }}>{alert.date}</span>
        </div>
        {alert.severity === "Critique" && (
          <div style={{ background: "#fbbf2411", border: "1px solid #fbbf2433", borderRadius: 7, padding: "8px 10px" }}>
            <p style={{ color: "#fbbf24", fontSize: 11, margin: 0, lineHeight: 1.5 }}>💡 Conservez de l'eau en bouteille par précaution.</p>
          </div>
        )}
      </div>
    )
  }

  if (zone && ZONES[zone]) {
    const info = ZONES[zone]
    const zAlerts = ALERTS.filter(a => a.location.includes(zone))
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: `${info.color}12`, border: `1px solid ${info.color}44`, borderRadius: 9, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>{info.potable ? "✅" : "⚠️"}</div>
          <div style={{ color: info.color, fontSize: 14, fontWeight: 700 }}>{info.message}</div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{zone}</div>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          {info.potable
            ? "L'eau du robinet est conforme aux normes dans votre quartier. Vous pouvez la consommer en toute sécurité."
            : "Une anomalie a été détectée dans votre secteur. Les équipes techniques SDE interviennent activement."}
        </p>
        {zAlerts.length > 0 && (
          <div>
            <p style={{ color: "#64748b", fontSize: 10, marginBottom: 5 }}>Incidents en cours :</p>
            {zAlerts.map(a => (
              <div key={a.alert_id} style={{ padding: "6px 9px", borderRadius: 6, background: `${SEVERITY_COLOR[a.severity] ?? "#94a3b8"}0d`, borderLeft: `3px solid ${SEVERITY_COLOR[a.severity] ?? "#94a3b8"}`, marginBottom: 4, color: "#94a3b8", fontSize: 11 }}>
                {a.type} — {a.status}
              </div>
            ))}
          </div>
        )}
        {!info.potable && (
          <a href="tel:800800800" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#f8717118", border: "1px solid #f8717133", borderRadius: 8, padding: "10px", color: "#f87171", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            📞 Urgence SDE : 800 800 800
          </a>
        )}
      </div>
    )
  }

  return null
}
