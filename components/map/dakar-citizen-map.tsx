"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES
// ─────────────────────────────────────────────────────────────────────────────

const NODES = [{"id":"R1","type":"reservoir","name":"Château d'Eau Plateau","lat":14.693,"lng":-17.445,"zone":"Plateau","capacity_m3":50000},{"id":"R2","type":"reservoir","name":"Réservoir Médina","lat":14.688,"lng":-17.46,"zone":"Médina","capacity_m3":35000},{"id":"R3","type":"reservoir","name":"Réservoir Pikine","lat":14.752,"lng":-17.388,"zone":"Pikine","capacity_m3":45000},{"id":"R4","type":"reservoir","name":"Réservoir Parcelles","lat":14.733,"lng":-17.412,"zone":"Parcelles Assainies","capacity_m3":30000},{"id":"P1","type":"pump","name":"Station Pompage Fann","lat":14.7,"lng":-17.463,"zone":"Fann"},{"id":"P2","type":"pump","name":"Station Pompage HLM","lat":14.71,"lng":-17.443,"zone":"HLM"},{"id":"P3","type":"pump","name":"Station Parcelles","lat":14.73,"lng":-17.415,"zone":"Parcelles Assainies"},{"id":"P4","type":"pump","name":"Station Guédiawaye","lat":14.745,"lng":-17.407,"zone":"Guédiawaye"},{"id":"V1","type":"valve","name":"Vanne Médina Nord","lat":14.694,"lng":-17.452,"zone":"Médina","open_pct":100},{"id":"V2","type":"valve","name":"Vanne Grand Dakar","lat":14.714,"lng":-17.432,"zone":"Grand Dakar","open_pct":75},{"id":"J1","type":"junction","name":"Nœud Central Plateau","lat":14.69,"lng":-17.449,"zone":"Plateau"},{"id":"J2","type":"junction","name":"Nœud HLM-Médina","lat":14.707,"lng":-17.438,"zone":"HLM"},{"id":"J3","type":"junction","name":"Nœud Pikine Est","lat":14.75,"lng":-17.392,"zone":"Pikine"},{"id":"J4","type":"junction","name":"Nœud Parcelles","lat":14.738,"lng":-17.41,"zone":"Parcelles Assainies"},{"id":"J5","type":"junction","name":"Nœud Grand Dakar","lat":14.72,"lng":-17.425,"zone":"Grand Dakar"}]
const INTER_NODES = [{"id":"N1","zone":"Plateau","lat":14.694067,"lng":-17.454375},{"id":"N2","zone":"Plateau","lat":14.686051,"lng":-17.44942},{"id":"N5","zone":"Plateau","lat":14.689282,"lng":-17.454255},{"id":"N11","zone":"Médina","lat":14.696116,"lng":-17.453132},{"id":"N12","zone":"Médina","lat":14.686805,"lng":-17.462357},{"id":"N21","zone":"Fann","lat":14.706091,"lng":-17.471221},{"id":"N22","zone":"Fann","lat":14.696558,"lng":-17.46708},{"id":"N29","zone":"HLM","lat":14.70308,"lng":-17.43823},{"id":"N30","zone":"HLM","lat":14.702941,"lng":-17.446273},{"id":"N37","zone":"Grand Dakar","lat":14.721775,"lng":-17.436504},{"id":"N38","zone":"Grand Dakar","lat":14.717798,"lng":-17.434318},{"id":"N45","zone":"Parcelles Assainies","lat":14.722,"lng":-17.426775},{"id":"N46","zone":"Parcelles Assainies","lat":14.722412,"lng":-17.411686},{"id":"N53","zone":"Pikine","lat":14.744404,"lng":-17.385771},{"id":"N54","zone":"Pikine","lat":14.740677,"lng":-17.391957},{"id":"N63","zone":"Guédiawaye","lat":14.734013,"lng":-17.411896},{"id":"N64","zone":"Guédiawaye","lat":14.734428,"lng":-17.396773},{"id":"N71","zone":"Rufisque","lat":14.719506,"lng":-17.368506},{"id":"N72","zone":"Rufisque","lat":14.715301,"lng":-17.358827}]
const MAIN_PIPES = [{"from":"R1","to":"P1","risk":""},{"from":"R1","to":"J1","risk":""},{"from":"P1","to":"J1","risk":""},{"from":"J1","to":"V1","risk":""},{"from":"V1","to":"R2","risk":""},{"from":"R2","to":"J2","risk":""},{"from":"J1","to":"J2","risk":"high"},{"from":"J2","to":"P2","risk":""},{"from":"P2","to":"V2","risk":""},{"from":"V2","to":"J5","risk":""},{"from":"J5","to":"P3","risk":""},{"from":"P3","to":"R4","risk":""},{"from":"R4","to":"J4","risk":""},{"from":"J4","to":"P4","risk":""},{"from":"P4","to":"R3","risk":""},{"from":"R3","to":"J3","risk":""},{"from":"J3","to":"J4","risk":"medium"},{"from":"J2","to":"J5","risk":""},{"from":"J5","to":"J4","risk":""},{"from":"V2","to":"J3","risk":"medium"}]

const ALERTS = [
  {alert_id:"ALT-001",type:"Fuite détectée",location:"Grand Dakar",severity:"Critique",lat:14.712,lng:-17.438,date:"2026-03-11 09:20",status:"Équipes en intervention",description:"Une fuite importante a été détectée dans votre secteur. Conservez de l'eau en bouteille par précaution.",emoji:"🔴"},
  {alert_id:"ALT-002",type:"Panne pompe",location:"Quartier Fann",severity:"Critique",lat:14.7,lng:-17.463,date:"2026-03-11 10:10",status:"Intervention en cours",description:"La station de pompage est en panne. Une baisse de pression est possible à votre robinet.",emoji:"🔴"},
  {alert_id:"ALT-003",type:"Débit anormal",location:"Fann — Plateau",severity:"Alerte",lat:14.696,lng:-17.454,date:"2026-03-11 09:45",status:"En cours d'analyse",description:"Nos équipes analysent une anomalie de débit. Situation sous contrôle.",emoji:"⚠️"},
  {alert_id:"ALT-004",type:"Pression basse",location:"Médina",severity:"Alerte",lat:14.693,lng:-17.456,date:"2026-03-11 09:50",status:"Surveillance active",description:"Pression réduite dans ce secteur. Vous pouvez constater un faible débit au robinet.",emoji:"⚠️"},
]

// Données qualité par zone — centre géographique + statut
const ZONES: Record<string, {
  lat: number; lng: number
  potable: boolean; message: string
  color: string; fillColor: string
  ph: string; turbidity: string; chlorine: string
  radius: number
}> = {
  "Plateau":             {lat:14.690,lng:-17.448,potable:true, message:"Eau conforme",  color:"#34d399",fillColor:"#34d39918",ph:"7.2",turbidity:"0.5 NTU",chlorine:"0.52 mg/L",radius:750},
  "Médina":              {lat:14.690,lng:-17.460,potable:false,message:"Surveillance",  color:"#fbbf24",fillColor:"#fbbf2415",ph:"7.1",turbidity:"0.7 NTU",chlorine:"0.48 mg/L",radius:700},
  "Fann":                {lat:14.700,lng:-17.467,potable:false,message:"Anomalie",      color:"#fbbf24",fillColor:"#fbbf2415",ph:"7.3",turbidity:"0.6 NTU",chlorine:"0.50 mg/L",radius:700},
  "HLM":                 {lat:14.710,lng:-17.441,potable:true, message:"Eau conforme",  color:"#34d399",fillColor:"#34d39918",ph:"7.0",turbidity:"1.8 NTU",chlorine:"0.22 mg/L",radius:750},
  "Grand Dakar":         {lat:14.716,lng:-17.430,potable:false,message:"Incident actif",color:"#f87171",fillColor:"#f8717112",ph:"6.9",turbidity:"2.1 NTU",chlorine:"0.18 mg/L",radius:800},
  "Parcelles Assainies": {lat:14.730,lng:-17.415,potable:true, message:"Eau conforme",  color:"#34d399",fillColor:"#34d39918",ph:"7.2",turbidity:"0.9 NTU",chlorine:"0.45 mg/L",radius:900},
  "Pikine":              {lat:14.752,lng:-17.392,potable:true, message:"Eau conforme",  color:"#34d399",fillColor:"#34d39918",ph:"7.0",turbidity:"2.6 NTU",chlorine:"0.15 mg/L",radius:900},
  "Guédiawaye":          {lat:14.744,lng:-17.408,potable:true, message:"Eau conforme",  color:"#34d399",fillColor:"#34d39918",ph:"6.8",turbidity:"3.0 NTU",chlorine:"0.12 mg/L",radius:800},
  "Rufisque":            {lat:14.718,lng:-17.370,potable:true, message:"Eau conforme",  color:"#34d399",fillColor:"#34d39918",ph:"7.1",turbidity:"1.1 NTU",chlorine:"0.38 mg/L",radius:850},
}

const SEV_COLOR: Record<string,string> = {Critique:"#f87171",Alerte:"#fbbf24",Moyen:"#a78bfa",Faible:"#94a3b8"}
const STORAGE_KEY = "aqp_citoyen_quartier"
const TAB_H = 48  // hauteur de la barre d'onglets mobile en px

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
type MobileTab = "carte" | "quartiers" | "alertes"

export function DakarCitizenMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const leafletRef      = useRef<any>(null)
  const [mapReady,      setMapReady]      = useState(false)
  const [clock,         setClock]         = useState("")
  const [selectedZone,  setSelectedZone]  = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [isMobile,      setIsMobile]      = useState(false)
  const [mobileTab,     setMobileTab]     = useState<MobileTab>("carte")

  // ── Responsive ─────────────────────────────────────────────────────────
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

  // Quand on revient sur l'onglet "carte" mobile → forcer un invalidateSize
  useEffect(() => {
    if (mobileTab === "carte" && mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 50)
    }
  }, [mobileTab])

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 300)
  }, [sidebarOpen])

  // ── Horloge ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("fr-FR", {hour:"2-digit",minute:"2-digit"}))
    tick(); const id = setInterval(tick, 60000); return () => clearInterval(id)
  }, [])

  // ── Quartier sauvegardé ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && ZONES[saved]) setSelectedZone(saved)
    } catch {}
  }, [])

  const selectZone = useCallback((zone: string, flyTo = true) => {
    setSelectedZone(zone)
    try { localStorage.setItem(STORAGE_KEY, zone) } catch {}
    if (flyTo && mapRef.current && ZONES[zone]) {
      mapRef.current.setView([ZONES[zone].lat, ZONES[zone].lng], 14, {animate: true})
    }
  }, [])

  // ── Init Leaflet ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return
    import("leaflet").then(lm => {
      const L = lm.default ?? lm
      if (mapRef.current || !mapContainerRef.current) return
      const map = L.map(mapContainerRef.current, {
        center: [14.715, -17.430], zoom: 12,
        zoomControl: false, attributionControl: false,
        tap: true, tapTolerance: 20,
      })
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
      }).addTo(map)
      L.control.zoom({position: "bottomright"}).addTo(map)
      leafletRef.current = L
      mapRef.current = map
      setMapReady(true)
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  // ── Dessin couches Leaflet ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return

    // Index des nœuds
    const nm: Record<string, any> = {}
    NODES.forEach(n => nm[n.id] = n)
    INTER_NODES.forEach(n => nm[n.id] = n)

    // 1. ZONES — grands cercles colorés selon qualité
    Object.entries(ZONES).forEach(([zone, info]) => {
      const circle = L.circle([info.lat, info.lng], {
        radius: info.radius,
        color: info.color,
        fillColor: info.fillColor,
        fillOpacity: 1,
        weight: 1.5,
        opacity: 0.7,
      }).addTo(map)

      circle.on("click", () => {
        selectZone(zone, false)
        map.setView([info.lat, info.lng], 14, {animate: true})
        if (window.innerWidth < 1024) setMobileTab("quartiers")
      })

      // Label qualité flottant au centre de la zone
      L.marker([info.lat, info.lng], {
        icon: L.divIcon({
          html: `<div style="pointer-events:none;text-align:center;transform:translate(-50%,-50%)">
            <div style="font-size:10px;font-weight:700;color:${info.color};letter-spacing:0.04em;text-shadow:0 1px 4px #000c,0 0 8px #000a;white-space:nowrap">${zone}</div>
            <div style="font-size:9px;color:${info.color}cc;font-weight:600;text-shadow:0 1px 3px #000a">${info.message}</div>
          </div>`,
          className: "",
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
        zIndexOffset: -100,
      }).addTo(map)
    })

    // 2. CONDUITES PRINCIPALES (réseau simplifié)
    MAIN_PIPES.forEach(p => {
      const f = nm[p.from]; const t = nm[p.to]
      if (!f || !t) return
      const c = p.risk === "high" ? "#f87171aa"
              : p.risk === "medium" ? "#fbbf24aa"
              : "#22d3ee44"
      const w = p.risk === "high" ? 2.5 : p.risk === "medium" ? 2 : 1.5
      L.polyline([[f.lat, f.lng], [t.lat, t.lng]], {
        color: c, weight: w, opacity: 0.8,
      }).addTo(map)
    })

    // 3. RÉSERVOIRS — marqueurs enrichis
    NODES.filter(n => n.type === "reservoir").forEach(node => {
      const icon = L.divIcon({
        html: `<div style="width:34px;height:34px;background:#0f172a;border:2px solid #38bdf8;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 12px #38bdf866,0 2px 8px #0008;cursor:pointer">💧</div>`,
        className: "", iconSize: [34, 34], iconAnchor: [17, 17],
      })
      L.marker([node.lat, node.lng], {icon, zIndexOffset: 500}).addTo(map)
        .bindTooltip(
          `<div style="background:#0f172a;border:1px solid #38bdf833;color:#e2e8f0;padding:6px 10px;border-radius:7px;font-size:11px;font-family:monospace">
            <b style="color:#38bdf8">${node.name}</b><br>
            Capacité : ${(node as any).capacity_m3?.toLocaleString()} m³
          </div>`,
          {sticky: true, opacity: 1}
        )
    })

    // 4. STATIONS DE POMPAGE — marqueurs
    NODES.filter(n => n.type === "pump").forEach(node => {
      const alertZone = ALERTS.find(a => a.location.includes(node.zone))
      const bg = alertZone ? "#f8717122" : "#0f172a"
      const border = alertZone ? "#f87171" : "#22d3ee66"
      const icon = L.divIcon({
        html: `<div style="width:28px;height:28px;background:${bg};border:1.5px solid ${border};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 8px ${alertZone?"#f8717166":"#22d3ee33"}">⚙</div>`,
        className: "", iconSize: [28, 28], iconAnchor: [14, 14],
      })
      L.marker([node.lat, node.lng], {icon}).addTo(map)
        .bindTooltip(
          `<div style="background:#0f172a;border:1px solid #22d3ee22;color:#94a3b8;padding:5px 9px;border-radius:6px;font-size:11px;font-family:monospace">${node.name}</div>`,
          {sticky: true, opacity: 1}
        )
    })

    // 5. ALERTES — marqueurs pulsants
    ALERTS.forEach(alert => {
      const c = SEV_COLOR[alert.severity] ?? "#94a3b8"
      const isCritique = alert.severity === "Critique"
      const sz = isCritique ? 44 : 36

      // Zone de rayon
      L.circle([alert.lat, alert.lng], {
        radius: isCritique ? 300 : 200,
        color: c, fillColor: c, fillOpacity: 0.05, weight: 1, dashArray: "5 4",
      }).addTo(map)

      // Marqueur
      const icon = L.divIcon({
        html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;border:2.5px solid ${c};background:${c}1a;
          box-shadow:0 0 14px ${c}88,0 2px 8px #0006;display:flex;align-items:center;justify-content:center;
          font-size:${sz * 0.45}px;cursor:pointer;
          animation:${isCritique ? "czPulse 1.8s infinite" : "none"}">
          ${isCritique ? "⚡" : "⚠"}
        </div>`,
        className: "", iconSize: [sz, sz], iconAnchor: [sz/2, sz/2], zIndexOffset: 2000,
      })

      L.marker([alert.lat, alert.lng], {icon}).addTo(map)
        .on("click", () => {
          setSelectedAlert(alert)
          setSelectedZone(null)
          map.setView([alert.lat, alert.lng], 15, {animate: true})
          if (window.innerWidth < 1024) setMobileTab("alertes")
        })
    })
  }, [mapReady, selectZone])

  // ─── Rendu ──────────────────────────────────────────────────────────────
  const SW = 264

  return (
    <div style={{
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
      position: "relative", width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: "#020817",
    }}>
      <style>{`
        @keyframes czPulse {
          0%,100% { box-shadow: 0 0 14px #f8717188, 0 2px 8px #0006; transform: scale(1) }
          50%      { box-shadow: 0 0 24px #f87171cc, 0 2px 8px #0006; transform: scale(1.08) }
        }
        .cz-sb::-webkit-scrollbar { width: 3px }
        .cz-sb::-webkit-scrollbar-thumb { background: rgba(34,211,238,.25); border-radius: 2px }
        .leaflet-tooltip { background:transparent!important;border:none!important;box-shadow:none!important }
        .leaflet-tooltip::before { display:none!important }
        .cz-tab-btn:active { opacity: .7 }
        .cz-zone-row:active { opacity: .8 }
      `}</style>

      {/* ══════════════════════════════════════════════════
          MOBILE — BARRE D'ONGLETS EN HAUT
          Remplace totalement le drawer-depuis-le-bas.
          Zéro conflit avec la bottom nav.
      ══════════════════════════════════════════════════ */}
      {isMobile && (
        <div style={{
          display: "flex", flexShrink: 0,
          height: TAB_H,
          background: "#020c1b",
          borderBottom: "1px solid rgba(34,211,238,.2)",
        }}>
          {([
            {id:"carte",     icon:"🗺",  label:"Carte"},
            {id:"quartiers", icon:"🏘",  label:"Quartiers"},
            {id:"alertes",   icon:"⚠️",  label:"Alertes",  badge: ALERTS.filter(a=>a.severity==="Critique").length},
          ] as {id:MobileTab;icon:string;label:string;badge?:number}[]).map(tab => {
            const active = mobileTab === tab.id
            return (
              <button key={tab.id} className="cz-tab-btn"
                onClick={() => setMobileTab(tab.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                  border: "none", background: "transparent", cursor: "pointer",
                  borderBottom: active ? "2.5px solid #22d3ee" : "2.5px solid transparent",
                  transition: "all .15s", position: "relative",
                }}>
                <span style={{fontSize: 16}}>{tab.icon}</span>
                <span style={{
                  fontSize: 10, fontWeight: active ? 700 : 500,
                  color: active ? "#22d3ee" : "#475569",
                  letterSpacing: "0.03em",
                }}>{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span style={{
                    position: "absolute", top: 5, right: "calc(50% - 18px)",
                    background: "#f87171", color: "#fff",
                    fontSize: 9, fontWeight: 700, width: 16, height: 16,
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{tab.badge}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CONTENU PRINCIPAL
      ══════════════════════════════════════════════════ */}
      <div style={{flex: 1, display: "flex", overflow: "hidden", minHeight: 0}}>

        {/* ── DESKTOP SIDEBAR ── */}
        {!isMobile && (
          <div style={{
            width: sidebarOpen ? SW : 0, minWidth: sidebarOpen ? SW : 0,
            height: "100%", overflow: "hidden",
            transition: "width .25s ease,min-width .25s ease",
            background: "#020817", borderRight: "1px solid rgba(34,211,238,.2)",
            display: "flex", flexDirection: "column", flexShrink: 0,
          }}>
            <div className="cz-sb" style={{
              flex: 1, overflowY: "auto", width: SW,
              opacity: sidebarOpen ? 1 : 0, transition: "opacity .2s",
              padding: 14, display: "flex", flexDirection: "column", gap: 14,
            }}>
              <DesktopSidebarContent
                clock={clock}
                selectedZone={selectedZone}
                selectedAlert={selectedAlert}
                onSelectZone={(z) => { selectZone(z); setSelectedAlert(null) }}
                onSelectAlert={(a) => {
                  setSelectedAlert(a); setSelectedZone(null)
                  mapRef.current?.setView([a.lat, a.lng], 15, {animate: true})
                }}
                onClearDetail={() => { setSelectedZone(null); setSelectedAlert(null) }}
              />
            </div>
          </div>
        )}

        {/* ── ZONE MAP ── */}
        <div style={{flex: 1, position: "relative", minWidth: 0, display: "flex", flexDirection: "column"}}>

          {/* Toggle sidebar desktop */}
          {!isMobile && (
            <button onClick={() => setSidebarOpen(o => !o)} style={{
              position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 1000,
              width: 20, height: 52, background: "#020817",
              border: "1px solid rgba(34,211,238,.35)", borderLeft: "none",
              borderRadius: "0 8px 8px 0", cursor: "pointer",
              color: "#22d3ee", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "3px 0 12px rgba(0,0,0,.5)",
            }}>{sidebarOpen ? "‹" : "›"}</button>
          )}

          {/* Carte Leaflet — affichée quand desktop OU onglet "carte" mobile */}
          <div style={{
            flex: 1,
            display: (!isMobile || mobileTab === "carte") ? "block" : "none",
            position: "relative",
          }}>
            <div ref={mapContainerRef} style={{width: "100%", height: "100%"}} />

            {/* Bouton GPS — desktop bas-gauche, mobile haut-droite */}
            <button
              onClick={() => {
                if (!mapRef.current) return
                mapRef.current.locate({setView: true, maxZoom: 15})
                mapRef.current.once("locationfound", (e: any) => {
                  let best = "Plateau", bestD = Infinity
                  Object.entries(ZONES).forEach(([z, info]) => {
                    const d = Math.hypot(e.latlng.lat - info.lat, e.latlng.lng - info.lng)
                    if (d < bestD) { bestD = d; best = z }
                  })
                  selectZone(best, false)
                  if (isMobile) setMobileTab("quartiers")
                })
              }}
              style={{
                position: "absolute", zIndex: 1500,
                bottom: isMobile ? "auto" : 56,
                top: isMobile ? 10 : "auto",
                right: isMobile ? 10 : "auto",
                left: isMobile ? "auto" : 12,
                background: "#020817", border: "1px solid rgba(34,211,238,.5)",
                borderRadius: 10, padding: isMobile ? "8px 10px" : "8px 12px",
                color: "#22d3ee", fontSize: 11, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 3px 14px rgba(0,0,0,.55)",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              📍{!isMobile && " Ma position"}
            </button>

            {/* Légende desktop */}
            {!isMobile && (
              <div style={{
                position: "absolute", bottom: 56, right: 12, zIndex: 1000,
                background: "#020817cc", backdropFilter: "blur(8px)",
                border: "1px solid rgba(34,211,238,.2)", borderRadius: 10, padding: "10px 13px",
              }}>
                <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:7}}>LÉGENDE</p>
                {[
                  {c:"#34d399",l:"Eau conforme"},
                  {c:"#fbbf24",l:"Sous surveillance"},
                  {c:"#f87171",l:"Incident actif"},
                  {c:"#22d3ee",l:"Réseau eau"},
                  {c:"#f87171",l:"Conduite risquée"},
                ].map(x => (
                  <div key={x.l} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                    <div style={{width:8,height:8,borderRadius:2,background:x.c,flexShrink:0}}/>
                    <span style={{color:"#64748b",fontSize:10}}>{x.l}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Panel détail desktop — coin haut-droit */}
            {!isMobile && (selectedAlert || selectedZone) && (
              <div style={{
                position: "absolute", right: 12, top: 12, width: 240, zIndex: 1000,
                background: "#020817ee", backdropFilter: "blur(8px)",
                border: "1px solid rgba(34,211,238,.22)", borderRadius: 12,
                padding: 14, maxHeight: "calc(100% - 24px)", overflowY: "auto",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em"}}>
                    {selectedAlert ? "INCIDENT" : "QUARTIER"}
                  </span>
                  <button onClick={() => {setSelectedAlert(null);setSelectedZone(null)}}
                    style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:18,lineHeight:1}}>✕</button>
                </div>
                <DetailPanel alert={selectedAlert} zone={selectedZone} onCallUrgence={() => {}} />
              </div>
            )}
          </div>

          {/* ── ONGLET MOBILE : QUARTIERS ── */}
          {isMobile && mobileTab === "quartiers" && (
            <div className="cz-sb" style={{flex:1,overflowY:"auto",padding:"12px 14px 24px"}}>
              <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:12}}>
                QUALITÉ DE L'EAU — TOUS LES QUARTIERS
              </p>

              {/* Si une zone est sélectionnée, afficher son détail en haut */}
              {selectedZone && ZONES[selectedZone] && (
                <div style={{marginBottom:14}}>
                  <div style={{
                    background:`${ZONES[selectedZone].color}12`,
                    border:`1.5px solid ${ZONES[selectedZone].color}55`,
                    borderRadius:12, padding:"14px 16px", marginBottom:4,
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:ZONES[selectedZone].color,marginBottom:2}}>
                          {ZONES[selectedZone].potable ? "✅" : "⚠️"} {selectedZone}
                        </div>
                        <div style={{color:ZONES[selectedZone].color,fontSize:13,fontWeight:700}}>
                          {ZONES[selectedZone].message}
                        </div>
                      </div>
                      <button onClick={() => setSelectedZone(null)}
                        style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:18}}>✕</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:10}}>
                      {[
                        {label:"pH",              value: ZONES[selectedZone].ph},
                        {label:"Turbidité",        value: ZONES[selectedZone].turbidity},
                        {label:"Chlore résiduel",  value: ZONES[selectedZone].chlorine},
                      ].map(item => (
                        <div key={item.label} style={{background:"#ffffff08",borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                          <div style={{color:"#e2e8f0",fontSize:11,fontWeight:700}}>{item.value}</div>
                          <div style={{color:"#64748b",fontSize:9,marginTop:2}}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                    {ZONES[selectedZone].potable ? (
                      <p style={{color:"#94a3b8",fontSize:11,lineHeight:1.55,marginTop:10,marginBottom:0}}>
                        L'eau est conforme aux normes dans votre quartier. Vous pouvez la consommer en toute sécurité.
                      </p>
                    ) : (
                      <>
                        <p style={{color:"#fbbf24",fontSize:11,lineHeight:1.55,marginTop:10,marginBottom:8}}>
                          Anomalie détectée. Les équipes SDE interviennent activement.
                        </p>
                        <a href="tel:800800800" style={{
                          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                          background:"#f8717118",border:"1px solid #f8717133",borderRadius:8,
                          padding:"9px",color:"#f87171",fontSize:12,fontWeight:700,textDecoration:"none",
                        }}>📞 Urgence SDE : 800 800 800</a>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Grille de toutes les zones */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {Object.entries(ZONES).map(([zone, info]) => {
                  const active = selectedZone === zone
                  return (
                    <div key={zone} className="cz-zone-row"
                      onClick={() => {
                        selectZone(zone)
                        mapRef.current?.setView([info.lat, info.lng], 14, {animate: true})
                      }}
                      style={{
                        padding:"10px 11px", borderRadius:11, cursor:"pointer",
                        background: active ? `${info.color}18` : "rgba(255,255,255,0.03)",
                        border:`1.5px solid ${active ? info.color+"55" : "rgba(255,255,255,0.06)"}`,
                        transition:"all .15s",
                      }}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                        <div style={{
                          width:9,height:9,borderRadius:"50%",flexShrink:0,
                          background:info.color, boxShadow:`0 0 5px ${info.color}99`,
                        }}/>
                        <span style={{color:"#e2e8f0",fontSize:11,fontWeight:600}}>{zone}</span>
                      </div>
                      <div style={{color:info.color,fontSize:10,fontWeight:700,marginBottom:3}}>
                        {info.potable ? "✓ " : "⚠ "}{info.message}
                      </div>
                      <div style={{color:"#475569",fontSize:9}}>pH {info.ph} · Turb. {info.turbidity.split(" ")[0]}</div>
                    </div>
                  )
                })}
              </div>

              <div style={{color:"#1e3a5f",fontSize:10,textAlign:"center",marginTop:14}}>
                Données SDE Dakar · {clock}
              </div>
            </div>
          )}

          {/* ── ONGLET MOBILE : ALERTES ── */}
          {isMobile && mobileTab === "alertes" && (
            <div className="cz-sb" style={{flex:1,overflowY:"auto",padding:"12px 14px 24px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",margin:0}}>
                  INCIDENTS ACTIFS
                </p>
                <span style={{background:"#f8717133",color:"#f87171",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8}}>
                  {ALERTS.length}
                </span>
              </div>

              {/* Détail si une alerte est sélectionnée */}
              {selectedAlert && (
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
                    <button onClick={() => setSelectedAlert(null)}
                      style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:16}}>← Retour</button>
                  </div>
                  <DetailPanel alert={selectedAlert} zone={null} onCallUrgence={() => {}} />
                </div>
              )}

              {!selectedAlert && (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {ALERTS.map(a => {
                    const c = SEV_COLOR[a.severity] ?? "#94a3b8"
                    return (
                      <div key={a.alert_id} className="cz-zone-row"
                        onClick={() => {
                          setSelectedAlert(a)
                          mapRef.current?.setView([a.lat, a.lng], 15, {animate: true})
                          // aller sur la carte pour voir la position
                          setTimeout(() => setMobileTab("carte"), 400)
                        }}
                        style={{
                          padding:"11px 13px", borderRadius:12, cursor:"pointer",
                          background:`${c}0d`,
                          border:`1.5px solid ${c}33`,
                          borderLeft:`4px solid ${c}`,
                          transition:"all .15s",
                        }}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                          <div style={{color:c,fontSize:13,fontWeight:700}}>{a.emoji} {a.type}</div>
                          <span style={{background:`${c}22`,color:c,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:6,flexShrink:0}}>
                            {a.severity}
                          </span>
                        </div>
                        <div style={{color:"#94a3b8",fontSize:11,marginBottom:4}}>📍 {a.location}</div>
                        <div style={{color:"#475569",fontSize:10,lineHeight:1.4}}>
                          {a.description.slice(0, 80)}…
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:"#334155"}}>
                          <span>{a.status}</span>
                          <span>{a.date}</span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Appel urgence */}
                  <a href="tel:800800800" style={{
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    background:"#f8717112",border:"1px solid #f8717133",borderRadius:12,
                    padding:"13px",color:"#f87171",fontSize:13,fontWeight:700,
                    textDecoration:"none",marginTop:4,
                  }}>
                    📞 Urgence eau : 800 800 800
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR DESKTOP
// ─────────────────────────────────────────────────────────────────────────────
function DesktopSidebarContent({
  clock, selectedZone, selectedAlert,
  onSelectZone, onSelectAlert, onClearDetail,
}: {
  clock: string
  selectedZone: string | null
  selectedAlert: any
  onSelectZone: (z: string) => void
  onSelectAlert: (a: any) => void
  onClearDetail: () => void
}) {
  return (
    <>
      <p style={{color:"#22d3ee",fontSize:10,fontWeight:700,letterSpacing:"0.15em",margin:0}}>
        AQUAPULSE — CITOYEN
      </p>

      {/* Détail d'une zone sélectionnée */}
      {(selectedZone || selectedAlert) && (
        <div style={{borderBottom:"1px solid rgba(34,211,238,.1)",paddingBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em"}}>
              {selectedAlert ? "INCIDENT" : "DÉTAIL QUARTIER"}
            </span>
            <button onClick={onClearDetail}
              style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
          </div>
          <DetailPanel alert={selectedAlert} zone={selectedZone} onCallUrgence={() => {}} />
        </div>
      )}

      {/* Liste des zones */}
      <div>
        <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>
          QUALITÉ PAR QUARTIER
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {Object.entries(ZONES).map(([zone, info]) => (
            <div key={zone}
              onClick={() => onSelectZone(zone)}
              style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"6px 9px", borderRadius:7, cursor:"pointer",
                background: selectedZone===zone ? `${info.color}16` : "transparent",
                border:`1px solid ${selectedZone===zone ? info.color+"44" : "transparent"}`,
                transition:"all .15s",
              }}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{
                  width:7,height:7,borderRadius:"50%",flexShrink:0,
                  background:info.color, boxShadow:`0 0 4px ${info.color}88`,
                }}/>
                <span style={{color:"#94a3b8",fontSize:11}}>{zone}</span>
              </div>
              <span style={{color:info.color,fontSize:10,fontWeight:700}}>{info.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des incidents */}
      <div>
        <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>
          INCIDENTS{" "}
          <span style={{background:"#f8717133",borderRadius:3,padding:"1px 5px"}}>{ALERTS.length}</span>
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {ALERTS.map(a => {
            const c = SEV_COLOR[a.severity] ?? "#94a3b8"
            return (
              <div key={a.alert_id}
                onClick={() => onSelectAlert(a)}
                style={{
                  padding:"7px 9px", borderRadius:7, cursor:"pointer",
                  background: selectedAlert?.alert_id===a.alert_id ? `${c}10` : "transparent",
                  borderLeft:`3px solid ${c}`,
                  border:`1px solid ${c}22`, borderLeft:`3px solid ${c}`,
                  transition:"all .15s",
                }}>
                <div style={{color:c,fontSize:11,fontWeight:700,marginBottom:2}}>{a.emoji} {a.type}</div>
                <div style={{color:"#64748b",fontSize:10}}>{a.location}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        color:"#334155", fontSize:10, textAlign:"center",
        borderTop:"1px solid rgba(34,211,238,.08)", paddingTop:8,
      }}>
        Mis à jour {clock}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PANNEAU DÉTAIL PARTAGÉ
// ─────────────────────────────────────────────────────────────────────────────
function DetailPanel({alert, zone, onCallUrgence}: {
  alert: any; zone: string | null; onCallUrgence: () => void
}) {
  if (alert) {
    const c = SEV_COLOR[alert.severity] ?? "#94a3b8"
    return (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:`${c}12`,border:`1px solid ${c}44`,borderRadius:9,padding:"10px 12px"}}>
          <div style={{color:c,fontSize:14,fontWeight:700,marginBottom:3}}>
            {alert.emoji} {alert.type}
          </div>
          <div style={{color:"#64748b",fontSize:11}}>📍 {alert.location}</div>
        </div>
        <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.65,margin:0}}>{alert.description}</p>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
          <span style={{color:"#475569"}}>Statut</span>
          <span style={{color:"#e2e8f0",fontWeight:600}}>{alert.status}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
          <span style={{color:"#475569"}}>Signalé</span>
          <span style={{color:"#64748b"}}>{alert.date}</span>
        </div>
        {alert.severity === "Critique" && (
          <>
            <div style={{background:"#fbbf2411",border:"1px solid #fbbf2433",borderRadius:7,padding:"8px 10px"}}>
              <p style={{color:"#fbbf24",fontSize:11,margin:0,lineHeight:1.5}}>
                💡 Conservez de l'eau en bouteille par précaution.
              </p>
            </div>
            <a href="tel:800800800" style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              background:"#f8717114",border:"1px solid #f8717133",borderRadius:8,
              padding:"9px",color:"#f87171",fontSize:12,fontWeight:700,textDecoration:"none",
            }}>📞 800 800 800</a>
          </>
        )}
      </div>
    )
  }

  if (zone && ZONES[zone]) {
    const info = ZONES[zone]
    const zAlerts = ALERTS.filter(a => a.location.includes(zone))
    return (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:`${info.color}12`,border:`1px solid ${info.color}44`,borderRadius:9,padding:"12px 14px",textAlign:"center"}}>
          <div style={{fontSize:22,marginBottom:3}}>{info.potable ? "✅" : "⚠️"}</div>
          <div style={{color:info.color,fontSize:14,fontWeight:700}}>{info.message}</div>
          <div style={{color:"#64748b",fontSize:11,marginTop:3}}>{zone}</div>
        </div>

        {/* Indicateurs qualité */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {[
            {label:"pH",           value:info.ph},
            {label:"Turbidité",    value:info.turbidity},
            {label:"Chlore",       value:info.chlorine},
          ].map(item => (
            <div key={item.label} style={{background:"#ffffff08",borderRadius:7,padding:"6px 7px",textAlign:"center"}}>
              <div style={{color:"#e2e8f0",fontSize:11,fontWeight:700}}>{item.value}</div>
              <div style={{color:"#475569",fontSize:9,marginTop:2}}>{item.label}</div>
            </div>
          ))}
        </div>

        <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.6,margin:0}}>
          {info.potable
            ? "L'eau du robinet est conforme aux normes SDE dans votre quartier."
            : "Une anomalie a été détectée. Les équipes SDE interviennent activement."}
        </p>

        {zAlerts.length > 0 && (
          <div>
            <p style={{color:"#64748b",fontSize:10,marginBottom:5}}>Incidents en cours :</p>
            {zAlerts.map(a => (
              <div key={a.alert_id} style={{
                padding:"6px 9px", borderRadius:6, marginBottom:4,
                background:`${SEV_COLOR[a.severity] ?? "#94a3b8"}0d`,
                borderLeft:`3px solid ${SEV_COLOR[a.severity] ?? "#94a3b8"}`,
                color:"#94a3b8", fontSize:11,
              }}>
                {a.type} — {a.status}
              </div>
            ))}
          </div>
        )}

        {!info.potable && (
          <a href="tel:800800800" style={{
            display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            background:"#f8717114",border:"1px solid #f8717133",borderRadius:8,
            padding:"9px",color:"#f87171",fontSize:12,fontWeight:700,textDecoration:"none",
          }}>📞 Urgence SDE : 800 800 800</a>
        )}
      </div>
    )
  }

  return null
}
