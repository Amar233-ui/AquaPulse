"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES — identiques à l'original
// ─────────────────────────────────────────────────────────────────────────────

const NODES = [{"id":"R1","type":"reservoir","name":"Château d'Eau Plateau","lat":14.693,"lng":-17.445,"zone":"Plateau","capacity_m3":50000},{"id":"R2","type":"reservoir","name":"Réservoir Médina","lat":14.688,"lng":-17.46,"zone":"Médina","capacity_m3":35000},{"id":"R3","type":"reservoir","name":"Réservoir Pikine","lat":14.752,"lng":-17.388,"zone":"Pikine","capacity_m3":45000},{"id":"R4","type":"reservoir","name":"Réservoir Parcelles","lat":14.733,"lng":-17.412,"zone":"Parcelles Assainies","capacity_m3":30000},{"id":"P1","type":"pump","name":"Station Pompage Fann","lat":14.7,"lng":-17.463,"zone":"Fann","flow_m3h":1200},{"id":"P2","type":"pump","name":"Station Pompage HLM","lat":14.71,"lng":-17.443,"zone":"HLM","flow_m3h":900},{"id":"P3","type":"pump","name":"Station Parcelles","lat":14.73,"lng":-17.415,"zone":"Parcelles Assainies","flow_m3h":1100},{"id":"P4","type":"pump","name":"Station Guédiawaye","lat":14.745,"lng":-17.407,"zone":"Guédiawaye","flow_m3h":800},{"id":"V1","type":"valve","name":"Vanne Médina Nord","lat":14.694,"lng":-17.452,"zone":"Médina","open_pct":100},{"id":"V2","type":"valve","name":"Vanne Grand Dakar","lat":14.714,"lng":-17.432,"zone":"Grand Dakar","open_pct":75},{"id":"V3","type":"valve","name":"Vanne Guédiawaye","lat":14.742,"lng":-17.405,"zone":"Guédiawaye","open_pct":100},{"id":"V4","type":"valve","name":"Vanne Rufisque","lat":14.718,"lng":-17.37,"zone":"Rufisque","open_pct":85},{"id":"J1","type":"junction","name":"Nœud Central Plateau","lat":14.69,"lng":-17.449,"zone":"Plateau"},{"id":"J2","type":"junction","name":"Nœud HLM-Médina","lat":14.707,"lng":-17.438,"zone":"HLM"},{"id":"J3","type":"junction","name":"Nœud Pikine Est","lat":14.75,"lng":-17.392,"zone":"Pikine"},{"id":"J4","type":"junction","name":"Nœud Parcelles-Guédiawaye","lat":14.738,"lng":-17.41,"zone":"Parcelles Assainies"},{"id":"J5","type":"junction","name":"Nœud Grand Dakar Sud","lat":14.72,"lng":-17.425,"zone":"Grand Dakar"}]
const INTER_NODES = [{"id":"N1","zone":"Plateau","lat":14.694067,"lng":-17.454375},{"id":"N2","zone":"Plateau","lat":14.686051,"lng":-17.44942},{"id":"N3","zone":"Plateau","lat":14.696202,"lng":-17.438083},{"id":"N4","zone":"Plateau","lat":14.699628,"lng":-17.452827},{"id":"N5","zone":"Plateau","lat":14.689282,"lng":-17.454255},{"id":"N6","zone":"Plateau","lat":14.68481,"lng":-17.442366},{"id":"N7","zone":"Plateau","lat":14.680584,"lng":-17.450029},{"id":"N8","zone":"Plateau","lat":14.694297,"lng":-17.441376},{"id":"N9","zone":"Plateau","lat":14.68485,"lng":-17.440268},{"id":"N10","zone":"Plateau","lat":14.697807,"lng":-17.454838},{"id":"N11","zone":"Médina","lat":14.696116,"lng":-17.453132},{"id":"N12","zone":"Médina","lat":14.686805,"lng":-17.462357},{"id":"N13","zone":"Médina","lat":14.699144,"lng":-17.459278},{"id":"N14","zone":"Médina","lat":14.681855,"lng":-17.463356},{"id":"N15","zone":"Médina","lat":14.69695,"lng":-17.454737},{"id":"N16","zone":"Médina","lat":14.696143,"lng":-17.452595},{"id":"N17","zone":"Médina","lat":14.690725,"lng":-17.448457},{"id":"N18","zone":"Médina","lat":14.687571,"lng":-17.455615},{"id":"N19","zone":"Médina","lat":14.696588,"lng":-17.454485},{"id":"N20","zone":"Médina","lat":14.697234,"lng":-17.455185},{"id":"N21","zone":"Fann","lat":14.706091,"lng":-17.471221},{"id":"N22","zone":"Fann","lat":14.696558,"lng":-17.46708},{"id":"N23","zone":"Fann","lat":14.693596,"lng":-17.468043},{"id":"N24","zone":"Fann","lat":14.69402,"lng":-17.467274},{"id":"N25","zone":"Fann","lat":14.704714,"lng":-17.465798},{"id":"N26","zone":"Fann","lat":14.699404,"lng":-17.468438},{"id":"N27","zone":"Fann","lat":14.69734,"lng":-17.456077},{"id":"N28","zone":"Fann","lat":14.704961,"lng":-17.461645},{"id":"N29","zone":"HLM","lat":14.70308,"lng":-17.43823},{"id":"N30","zone":"HLM","lat":14.702941,"lng":-17.446273},{"id":"N31","zone":"HLM","lat":14.717811,"lng":-17.44028},{"id":"N32","zone":"HLM","lat":14.710025,"lng":-17.439254},{"id":"N33","zone":"HLM","lat":14.715171,"lng":-17.437152},{"id":"N34","zone":"HLM","lat":14.704123,"lng":-17.454262},{"id":"N35","zone":"HLM","lat":14.705678,"lng":-17.448842},{"id":"N36","zone":"HLM","lat":14.703798,"lng":-17.433313},{"id":"N37","zone":"Grand Dakar","lat":14.721775,"lng":-17.436504},{"id":"N38","zone":"Grand Dakar","lat":14.717798,"lng":-17.434318},{"id":"N39","zone":"Grand Dakar","lat":14.722462,"lng":-17.432611},{"id":"N40","zone":"Grand Dakar","lat":14.710768,"lng":-17.438341},{"id":"N41","zone":"Grand Dakar","lat":14.716105,"lng":-17.437906},{"id":"N42","zone":"Grand Dakar","lat":14.716523,"lng":-17.420759},{"id":"N43","zone":"Grand Dakar","lat":14.713189,"lng":-17.439078},{"id":"N44","zone":"Grand Dakar","lat":14.723956,"lng":-17.431243},{"id":"N45","zone":"Parcelles Assainies","lat":14.722,"lng":-17.426775},{"id":"N46","zone":"Parcelles Assainies","lat":14.722412,"lng":-17.411686},{"id":"N47","zone":"Parcelles Assainies","lat":14.737426,"lng":-17.417024},{"id":"N48","zone":"Parcelles Assainies","lat":14.721398,"lng":-17.418078},{"id":"N49","zone":"Parcelles Assainies","lat":14.741915,"lng":-17.414243},{"id":"N50","zone":"Parcelles Assainies","lat":14.741364,"lng":-17.40562},{"id":"N51","zone":"Parcelles Assainies","lat":14.720253,"lng":-17.409261},{"id":"N52","zone":"Parcelles Assainies","lat":14.734998,"lng":-17.414039},{"id":"N53","zone":"Pikine","lat":14.744404,"lng":-17.385771},{"id":"N54","zone":"Pikine","lat":14.740677,"lng":-17.391957},{"id":"N55","zone":"Pikine","lat":14.748889,"lng":-17.376386},{"id":"N56","zone":"Pikine","lat":14.75902,"lng":-17.397098},{"id":"N57","zone":"Pikine","lat":14.750014,"lng":-17.39964},{"id":"N58","zone":"Pikine","lat":14.759903,"lng":-17.378884},{"id":"N59","zone":"Pikine","lat":14.745163,"lng":-17.385832},{"id":"N60","zone":"Pikine","lat":14.752615,"lng":-17.400415},{"id":"N61","zone":"Pikine","lat":14.7563,"lng":-17.388819},{"id":"N62","zone":"Pikine","lat":14.756687,"lng":-17.389089},{"id":"N63","zone":"Guédiawaye","lat":14.734013,"lng":-17.411896},{"id":"N64","zone":"Guédiawaye","lat":14.734428,"lng":-17.396773},{"id":"N65","zone":"Guédiawaye","lat":14.753332,"lng":-17.399208},{"id":"N66","zone":"Guédiawaye","lat":14.740765,"lng":-17.418552},{"id":"N67","zone":"Guédiawaye","lat":14.753316,"lng":-17.396326},{"id":"N68","zone":"Guédiawaye","lat":14.735884,"lng":-17.40785},{"id":"N69","zone":"Guédiawaye","lat":14.735523,"lng":-17.400985},{"id":"N70","zone":"Guédiawaye","lat":14.750848,"lng":-17.41679},{"id":"N71","zone":"Rufisque","lat":14.719506,"lng":-17.368506},{"id":"N72","zone":"Rufisque","lat":14.715301,"lng":-17.358827},{"id":"N73","zone":"Rufisque","lat":14.718463,"lng":-17.378646},{"id":"N74","zone":"Rufisque","lat":14.720786,"lng":-17.363102},{"id":"N75","zone":"Rufisque","lat":14.714023,"lng":-17.375649},{"id":"N76","zone":"Rufisque","lat":14.729903,"lng":-17.365504},{"id":"N77","zone":"Rufisque","lat":14.718762,"lng":-17.369473},{"id":"N78","zone":"Rufisque","lat":14.71242,"lng":-17.378259}]
const PIPES = [{"id":"PIPE-01","from":"R1","to":"P1","diameter_mm":400,"length_m":2144,"material":"fonte","zone":"Plateau-Fann"},{"id":"PIPE-02","from":"R1","to":"J1","diameter_mm":350,"length_m":555,"material":"PVC","zone":"Plateau"},{"id":"PIPE-03","from":"P1","to":"J1","diameter_mm":300,"length_m":1910,"material":"PVC","zone":"Fann-Plateau"},{"id":"PIPE-04","from":"J1","to":"V1","diameter_mm":300,"length_m":555,"material":"PVC","zone":"Plateau-Médina"},{"id":"PIPE-05","from":"V1","to":"R2","diameter_mm":300,"length_m":1110,"material":"fonte","zone":"Médina"},{"id":"PIPE-06","from":"R2","to":"J2","diameter_mm":350,"length_m":3227,"material":"PVC","zone":"Médina-HLM"},{"id":"PIPE-07","from":"J1","to":"J2","diameter_mm":250,"length_m":2248,"material":"amiante-ciment","zone":"Plateau-HLM","age_years":35,"risk":"high"},{"id":"PIPE-08","from":"J2","to":"P2","diameter_mm":300,"length_m":647,"material":"PVC","zone":"HLM"},{"id":"PIPE-09","from":"P2","to":"V2","diameter_mm":250,"length_m":1299,"material":"PVC","zone":"HLM-Grand Dakar"},{"id":"PIPE-10","from":"V2","to":"J5","diameter_mm":300,"length_m":1023,"material":"fonte","zone":"Grand Dakar"},{"id":"PIPE-11","from":"J5","to":"P3","diameter_mm":300,"length_m":1570,"material":"PVC","zone":"Grand Dakar-Parcelles Assainies"},{"id":"PIPE-12","from":"P3","to":"R4","diameter_mm":350,"length_m":471,"material":"PVC","zone":"Parcelles Assainies"},{"id":"PIPE-13","from":"R4","to":"J4","diameter_mm":300,"length_m":598,"material":"acier","zone":"Parcelles Assainies"},{"id":"PIPE-14","from":"J4","to":"P4","diameter_mm":300,"length_m":845,"material":"PVC","zone":"Parcelles Assainies-Guédiawaye"},{"id":"PIPE-15","from":"P4","to":"V3","diameter_mm":300,"length_m":400,"material":"fonte","zone":"Guédiawaye"},{"id":"PIPE-16","from":"V3","to":"R3","diameter_mm":400,"length_m":2189,"material":"acier","zone":"Guédiawaye-Pikine"},{"id":"PIPE-17","from":"R3","to":"J3","diameter_mm":350,"length_m":496,"material":"PVC","zone":"Pikine"},{"id":"PIPE-18","from":"J3","to":"J4","diameter_mm":250,"length_m":2401,"material":"fonte","zone":"Pikine-Parcelles Assainies","age_years":28,"risk":"medium"},{"id":"PIPE-19","from":"J2","to":"J5","diameter_mm":200,"length_m":2041,"material":"PVC","zone":"HLM-Grand Dakar"},{"id":"PIPE-20","from":"J5","to":"J4","diameter_mm":200,"length_m":2601,"material":"PVC","zone":"Grand Dakar-Parcelles Assainies"},{"id":"PIPE-21","from":"V2","to":"V4","diameter_mm":200,"length_m":6896,"material":"fonte","zone":"Grand Dakar-Rufisque","age_years":22,"risk":"medium"},{"id":"PIPE-22","from":"V4","to":"J3","diameter_mm":250,"length_m":4310,"material":"PVC","zone":"Rufisque-Pikine"}]
const SENSORS = [{"sensor_id":"S1_acoustic","node_id":"J1","kind":"acoustic","name":"Acoustique Plateau","lat":14.69,"lng":-17.449,"zone":"Plateau","value":0.94,"unit":"score","status":"critique"},{"sensor_id":"S2_acoustic","node_id":"J2","kind":"acoustic","name":"Acoustique HLM","lat":14.707,"lng":-17.438,"zone":"HLM","value":0.12,"unit":"score","status":"normal"},{"sensor_id":"S3_acoustic","node_id":"J3","kind":"acoustic","name":"Acoustique Pikine","lat":14.75,"lng":-17.392,"zone":"Pikine","value":0.08,"unit":"score","status":"normal"},{"sensor_id":"S1_pressure","node_id":"R1","kind":"pressure","name":"Pression Château d'Eau","lat":14.693,"lng":-17.445,"zone":"Plateau","value":3.4,"unit":"bar","status":"normal"},{"sensor_id":"S2_pressure","node_id":"P1","kind":"pressure","name":"Pression Fann","lat":14.7,"lng":-17.463,"zone":"Fann","value":2.1,"unit":"bar","status":"alerte"},{"sensor_id":"S3_pressure","node_id":"V2","kind":"pressure","name":"Pression Grand Dakar","lat":14.714,"lng":-17.432,"zone":"Grand Dakar","value":1.8,"unit":"bar","status":"critique"},{"sensor_id":"S4_pressure","node_id":"P3","kind":"pressure","name":"Pression Parcelles","lat":14.73,"lng":-17.415,"zone":"Parcelles Assainies","value":3.2,"unit":"bar","status":"normal"},{"sensor_id":"M1_flow","node_id":"P1","kind":"flow","name":"Débit Fann","lat":14.7,"lng":-17.463,"zone":"Fann","value":1360,"unit":"m³/h","status":"alerte"},{"sensor_id":"M2_flow","node_id":"P2","kind":"flow","name":"Débit HLM","lat":14.71,"lng":-17.443,"zone":"HLM","value":870,"unit":"m³/h","status":"normal"},{"sensor_id":"M3_flow","node_id":"P3","kind":"flow","name":"Débit Parcelles","lat":14.73,"lng":-17.415,"zone":"Parcelles Assainies","value":1050,"unit":"m³/h","status":"normal"},{"sensor_id":"M4_flow","node_id":"P4","kind":"flow","name":"Débit Guédiawaye","lat":14.745,"lng":-17.407,"zone":"Guédiawaye","value":780,"unit":"m³/h","status":"normal"},{"sensor_id":"Q1_quality","node_id":"R1","kind":"quality","name":"Qualité Réservoir Nord","lat":14.693,"lng":-17.445,"zone":"Plateau","value":7.2,"unit":"pH","status":"normal"},{"sensor_id":"Q2_quality","node_id":"R2","kind":"quality","name":"Qualité Réservoir Médina","lat":14.688,"lng":-17.46,"zone":"Médina","value":7.1,"unit":"pH","status":"normal"},{"sensor_id":"R1_level","node_id":"R1","kind":"level","name":"Niveau Château d'Eau","lat":14.693,"lng":-17.445,"zone":"Plateau","value":81.3,"unit":"%","status":"normal"},{"sensor_id":"R2_level","node_id":"R2","kind":"level","name":"Niveau Réservoir Médina","lat":14.688,"lng":-17.46,"zone":"Médina","value":74.2,"unit":"%","status":"normal"},{"sensor_id":"R3_level","node_id":"R3","kind":"level","name":"Niveau Réservoir Pikine","lat":14.752,"lng":-17.388,"zone":"Pikine","value":68.9,"unit":"%","status":"normal"},{"sensor_id":"R4_level","node_id":"R4","kind":"level","name":"Niveau Réservoir Parcelles","lat":14.733,"lng":-17.412,"zone":"Parcelles Assainies","value":71.5,"unit":"%","status":"normal"},{"sensor_id":"P1_health","node_id":"P1","kind":"pump_health","name":"Santé Pompe Fann","lat":14.7,"lng":-17.463,"zone":"Fann","value":62,"unit":"°C","status":"critique"},{"sensor_id":"P2_health","node_id":"P2","kind":"pump_health","name":"Santé Pompe HLM","lat":14.71,"lng":-17.443,"zone":"HLM","value":45,"unit":"°C","status":"normal"}]
const ALERTS = [{"alert_id":"ALT-001","type":"Fuite","location":"Grand Dakar — J1-J2","severity":"Critique","probability":0.94,"lat":14.712,"lng":-17.438,"pipe_id":"PIPE-07","date":"2026-03-11 09:20","status":"En cours","estimated_loss_m3h":85,"description":"Vibrations acoustiques anormales sur canalisation amiante-ciment"},{"alert_id":"ALT-002","type":"Panne pompe","location":"Station Fann — P1","severity":"Critique","probability":0.91,"lat":14.7,"lng":-17.463,"pipe_id":null,"date":"2026-03-11 10:10","status":"En cours","estimated_loss_m3h":0,"description":"Surchauffe (62°C) et vibrations anormales"},{"alert_id":"ALT-003","type":"Débit anormal","location":"Fann-Plateau","severity":"Alerte","probability":0.78,"lat":14.696,"lng":-17.454,"pipe_id":"PIPE-01","date":"2026-03-11 09:45","status":"Analyse","estimated_loss_m3h":40,"description":"Débit 15% au-dessus de la normale"},{"alert_id":"ALT-004","type":"Pression basse","location":"Zone Médina","severity":"Alerte","probability":0.65,"lat":14.693,"lng":-17.456,"pipe_id":"PIPE-05","date":"2026-03-11 09:50","status":"Surveillance","estimated_loss_m3h":0,"description":"Pression en baisse continue depuis 2h"}]

const SENSOR_COLORS: Record<string,string> = {acoustic:"#a78bfa",pressure:"#38bdf8",flow:"#34d399",quality:"#22d3ee",level:"#fbbf24",pump_health:"#f87171"}
const SEV_COLOR: Record<string,string> = {Critique:"#f87171",Alerte:"#fbbf24",Moyen:"#a78bfa",Faible:"#94a3b8"}
const NODE_META: Record<string,{sym:string;color:string}> = {
  reservoir: {sym:"▣", color:"#38bdf8"},
  pump:      {sym:"⚙", color:"#fbbf24"},
  valve:     {sym:"◈", color:"#a78bfa"},
  junction:  {sym:"◎", color:"#475569"},
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type MobileTab = "carte" | "alertes" | "capteurs" | "reseau"

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function DakarWaterMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const leafletRef      = useRef<any>(null)
  const [mapReady,       setMapReady]       = useState(false)
  const [clock,          setClock]          = useState("")
  const [selectedSensor, setSelectedSensor] = useState<any>(null)
  const [selectedAlert,  setSelectedAlert]  = useState<any>(null)
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [isMobile,       setIsMobile]       = useState(false)
  const [mobileTab,      setMobileTab]      = useState<MobileTab>("carte")
  const [sensorFilter,   setSensorFilter]   = useState<"all"|"critique"|"alerte">("all")

  // Dérivés utiles
  const totalFlow     = SENSORS.filter(s => s.kind === "flow").reduce((a, s) => a + s.value, 0)
  const critCount     = SENSORS.filter(s => s.status === "critique").length
  const alerteCount   = SENSORS.filter(s => s.status === "alerte").length
  const normalCount   = SENSORS.filter(s => s.status === "normal").length
  const totalLoss     = ALERTS.reduce((a, al) => a + (al.estimated_loss_m3h ?? 0), 0)
  const critAlerts    = ALERTS.filter(a => a.severity === "Critique").length

  // ── Responsive ──────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (mobileTab === "carte" && mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 50)
    }
  }, [mobileTab])

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 300)
  }, [sidebarOpen])

  // ── Horloge ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("fr-FR", {hour:"2-digit",minute:"2-digit",second:"2-digit"}))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  // ── Navigation vers élément ──────────────────────────────────────────────
  const flyTo = useCallback((lat: number, lng: number, zoom = 15) => {
    mapRef.current?.setView([lat, lng], zoom, {animate: true})
    if (isMobile) setMobileTab("carte")
  }, [isMobile])

  // ── Init Leaflet ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return
    import("leaflet").then(lm => {
      const L = lm.default ?? lm
      if (mapRef.current || !mapContainerRef.current) return
      const map = L.map(mapContainerRef.current, {
        center: [14.715, -17.430], zoom: 13,
        zoomControl: false, attributionControl: false,
        tap: true, tapTolerance: 15,
      })
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {subdomains:"abcd",maxZoom:19}).addTo(map)
      L.control.zoom({position:"bottomright"}).addTo(map)
      leafletRef.current = L
      mapRef.current = map
      setMapReady(true)
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  // ── Dessin des couches ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const L = leafletRef.current; const map = mapRef.current
    if (!L || !map) return

    const nm: Record<string,any> = {}
    NODES.forEach(n => nm[n.id] = n)
    INTER_NODES.forEach(n => nm[n.id] = n)

    // 1. CONDUITES — épaisseur proportionnelle au diamètre
    PIPES.forEach((p: any) => {
      const f = nm[p.from]; const t = nm[p.to]
      if (!f || !t) return
      const isAlert = ALERTS.some(a => a.pipe_id === p.id)
      const c = p.risk === "high" ? "#f87171"
              : p.risk === "medium" ? "#fbbf24"
              : isAlert ? "#fb923c"
              : "#22d3ee"
      const w = Math.max(1.5, (p.diameter_mm || 150) / 130)
      L.polyline([[f.lat, f.lng], [t.lat, t.lng]], {
        color: c, weight: w, opacity: 0.75,
        dashArray: p.risk === "high" ? "7 4" : p.risk === "medium" ? "12 4" : null,
      }).addTo(map).bindTooltip(
        `<div style="background:#0f172a;border:1px solid ${c}44;color:#e2e8f0;padding:6px 10px;border-radius:7px;font-size:11px;font-family:monospace">
          <b style="color:${c}">${p.id}</b><br/>
          ${p.from} → ${p.to}<br/>
          ∅ ${p.diameter_mm} mm · ${p.material}
          ${p.age_years ? `<br/><span style="color:${c}">⚠ Âge : ${p.age_years} ans</span>` : ""}
        </div>`, {sticky: true, opacity: 1}
      )
    })

    // 2. NŒUDS PRINCIPAUX (réservoirs, pompes, vannes, jonctions)
    NODES.forEach((node: any) => {
      const meta = NODE_META[node.type] ?? {sym: "●", color: "#64748b"}
      const icon = L.divIcon({
        html: `<div style="width:34px;height:34px;background:${meta.color}22;border:2px solid ${meta.color};border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:16px;color:${meta.color};box-shadow:0 0 12px ${meta.color}55;cursor:pointer">${meta.sym}</div>`,
        className: "", iconSize: [34, 34], iconAnchor: [17, 17],
      })
      L.marker([node.lat, node.lng], {icon}).addTo(map).bindTooltip(
        `<div style="background:#0f172a;border:1px solid ${meta.color}44;color:#e2e8f0;padding:7px 11px;border-radius:7px;font-size:11px;font-family:monospace">
          <b style="color:${meta.color}">${node.name}</b><br/>
          Zone : ${node.zone}
          ${node.capacity_m3 ? `<br/>Capacité : ${node.capacity_m3.toLocaleString()} m³` : ""}
          ${node.flow_m3h ? `<br/>Débit max : ${node.flow_m3h} m³/h` : ""}
          ${node.open_pct != null ? `<br/>Ouverture : ${node.open_pct}%` : ""}
        </div>`, {sticky: true, opacity: 1}
      )
    })

    // 3. CAPTEURS — points pulsants selon statut
    SENSORS.forEach((s: any) => {
      const c = s.status === "critique" ? "#f87171"
              : s.status === "alerte"   ? "#fbbf24"
              : SENSOR_COLORS[s.kind] ?? "#34d399"
      const pulse = s.status !== "normal"
      const icon = L.divIcon({
        html: `<div style="position:relative;width:22px;height:22px">
          ${pulse ? `<div style="position:absolute;inset:-5px;border-radius:50%;background:${c}33;animation:aqPulse 1.8s ease-out infinite"></div>` : ""}
          <div style="position:relative;width:22px;height:22px;border-radius:50%;background:${c}33;border:2px solid ${c};box-shadow:0 0 8px ${c}88"></div>
        </div>`,
        className: "", iconSize: [22, 22], iconAnchor: [11, 11],
      })
      L.marker([s.lat, s.lng], {icon}).addTo(map)
        .on("click", () => { setSelectedSensor(s); setSelectedAlert(null) })
        .bindTooltip(
          `<div style="background:#0f172a;border:1px solid ${c}44;color:#e2e8f0;padding:6px 10px;border-radius:7px;font-size:11px;font-family:monospace">
            <b style="color:${c}">${s.name}</b><br/>${s.value} ${s.unit} · ${s.zone}
          </div>`, {sticky: true, opacity: 1}
        )
    })

    // 4. ALERTES — marqueurs d'urgence pulsants
    ALERTS.forEach((alert: any) => {
      const c = SEV_COLOR[alert.severity] ?? "#94a3b8"
      const isCrit = alert.severity === "Critique"
      const sz = isCrit ? 40 : 32
      L.circle([alert.lat, alert.lng], {
        radius: isCrit ? 200 : 140,
        color: c, fillColor: c, fillOpacity: 0.06, weight: 1.5, dashArray: "5 4",
      }).addTo(map)
      const icon = L.divIcon({
        html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;border:2.5px solid ${c};background:${c}1a;
          box-shadow:0 0 16px ${c}99;display:flex;align-items:center;justify-content:center;font-size:${sz*0.44}px;cursor:pointer;
          animation:${isCrit?"aqGlow 1.5s ease-in-out infinite alternate":"none"}">⚠</div>`,
        className: "", iconSize: [sz, sz], iconAnchor: [sz/2, sz/2], zIndexOffset: 2000,
      })
      L.marker([alert.lat, alert.lng], {icon}).addTo(map)
        .on("click", () => { setSelectedAlert(alert); setSelectedSensor(null) })
    })
  }, [mapReady])

  // ─── Rendu ──────────────────────────────────────────────────────────────
  const SW = 268

  // Capteurs filtrés pour l'onglet mobile
  const filteredSensors = SENSORS.filter(s =>
    sensorFilter === "all"     ? true :
    sensorFilter === "critique" ? s.status === "critique" :
    s.status === "alerte"
  )

  return (
    <div style={{
      fontFamily: "monospace",
      position: "relative", width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: "#020817",
    }}>
      <style>{`
        @keyframes aqPulse { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.4);opacity:0} }
        @keyframes aqGlow  { from{box-shadow:0 0 10px #f8717166} to{box-shadow:0 0 22px #f87171} }
        .aq-sb::-webkit-scrollbar{width:3px}
        .aq-sb::-webkit-scrollbar-thumb{background:rgba(34,211,238,.3);border-radius:2px}
        .leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important}
        .leaflet-tooltip::before{display:none!important}
        .aq-row:active{opacity:.75}
      `}</style>

      {/* ══════════════════════════════════════════
          MOBILE — BARRE D'ONGLETS EN HAUT (4 onglets)
          Zéro conflit avec la bottom nav.
      ══════════════════════════════════════════ */}
      {isMobile && (
        <div style={{
          display: "flex", flexShrink: 0, height: 50,
          background: "#020c1b",
          borderBottom: "1px solid rgba(34,211,238,.2)",
        }}>
          {([
            {id:"carte",    icon:"🗺",  label:"Carte"},
            {id:"alertes",  icon:"⚡",  label:"Alertes",  badge: critAlerts},
            {id:"capteurs", icon:"📡", label:"Capteurs", badge: critCount + alerteCount},
            {id:"reseau",   icon:"🔧", label:"Réseau"},
          ] as {id:MobileTab;icon:string;label:string;badge?:number}[]).map(tab => {
            const active = mobileTab === tab.id
            const badgeCount = tab.badge ?? 0
            return (
              <button key={tab.id} className="aq-row"
                onClick={() => setMobileTab(tab.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                  border: "none", background: "transparent", cursor: "pointer",
                  borderBottom: active ? "2.5px solid #22d3ee" : "2.5px solid transparent",
                  transition: "all .15s", position: "relative",
                }}>
                <span style={{fontSize: 15}}>{tab.icon}</span>
                <span style={{
                  fontSize: 9, fontWeight: active ? 700 : 500,
                  color: active ? "#22d3ee" : "#475569",
                  letterSpacing: "0.03em", textTransform: "uppercase",
                }}>{tab.label}</span>
                {badgeCount > 0 && (
                  <span style={{
                    position: "absolute", top: 4, right: "calc(50% - 20px)",
                    background: tab.id === "alertes" ? "#f87171" : "#fbbf24",
                    color: "#000", fontSize: 8, fontWeight: 800,
                    width: 15, height: 15, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{badgeCount}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          CONTENU PRINCIPAL
      ══════════════════════════════════════════ */}
      <div style={{flex: 1, display: "flex", overflow: "hidden", minHeight: 0}}>

        {/* ── DESKTOP SIDEBAR ── */}
        {!isMobile && (
          <div style={{
            width: sidebarOpen ? SW : 0, minWidth: sidebarOpen ? SW : 0,
            height: "100%", overflow: "hidden",
            transition: "width .25s ease,min-width .25s ease",
            background: "#020817", borderRight: "1px solid rgba(34,211,238,.22)",
            display: "flex", flexDirection: "column", flexShrink: 0,
          }}>
            <div className="aq-sb" style={{
              flex: 1, overflowY: "auto", width: SW,
              opacity: sidebarOpen ? 1 : 0, transition: "opacity .2s",
              padding: 14, display: "flex", flexDirection: "column", gap: 14,
            }}>
              <DesktopSidebar
                clock={clock} totalFlow={totalFlow}
                critCount={critCount} alerteCount={alerteCount} normalCount={normalCount}
                totalLoss={totalLoss}
                selectedSensor={selectedSensor} selectedAlert={selectedAlert}
                onSelectSensor={(s) => { setSelectedSensor(s); setSelectedAlert(null); mapRef.current?.setView([s.lat, s.lng], 16, {animate: true}) }}
                onSelectAlert={(a)  => { setSelectedAlert(a);  setSelectedSensor(null); mapRef.current?.setView([a.lat, a.lng], 15, {animate: true}) }}
                onClear={() => { setSelectedSensor(null); setSelectedAlert(null) }}
              />
            </div>
          </div>
        )}

        {/* ── ZONE MAP + ONGLETS MOBILE ── */}
        <div style={{flex: 1, position: "relative", minWidth: 0, display: "flex", flexDirection: "column"}}>

          {/* Toggle sidebar desktop */}
          {!isMobile && (
            <button onClick={() => setSidebarOpen(o => !o)} style={{
              position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
              zIndex: 1000, width: 20, height: 52, background: "#020817",
              border: "1px solid rgba(34,211,238,.35)", borderLeft: "none",
              borderRadius: "0 8px 8px 0", cursor: "pointer",
              color: "#22d3ee", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "3px 0 12px rgba(0,0,0,.5)",
            }}>{sidebarOpen ? "‹" : "›"}</button>
          )}

          {/* ── ONGLET CARTE (desktop toujours / mobile si tab=carte) ── */}
          <div style={{
            flex: 1,
            display: (!isMobile || mobileTab === "carte") ? "flex" : "none",
            flexDirection: "column",
            position: "relative",
          }}>
            <div ref={mapContainerRef} style={{flex: 1}} />

            {/* Légende desktop */}
            {!isMobile && (
              <div style={{
                position: "absolute", bottom: 48, right: 12, zIndex: 1000,
                background: "#020817cc", backdropFilter: "blur(8px)",
                border: "1px solid rgba(34,211,238,.2)", borderRadius: 10, padding: "10px 13px",
              }}>
                <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:7}}>LÉGENDE</p>
                {[
                  {c:"#38bdf8",l:"Réservoir ▣"},
                  {c:"#fbbf24",l:"Pompe ⚙"},
                  {c:"#a78bfa",l:"Vanne ◈"},
                  {c:"#f87171",l:"Conduite risque élevé"},
                  {c:"#fbbf24",l:"Conduite risque moyen"},
                  {c:"#22d3ee",l:"Conduite normale"},
                ].map(x => (
                  <div key={x.l} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                    <div style={{width:8,height:8,borderRadius:2,background:x.c,flexShrink:0}}/>
                    <span style={{color:"#64748b",fontSize:10}}>{x.l}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Panel détail desktop */}
            {!isMobile && (selectedSensor || selectedAlert) && (
              <div style={{
                position: "absolute", right: 12, top: 12, width: 234, zIndex: 1000,
                background: "#020817ee", backdropFilter: "blur(8px)",
                border: "1px solid rgba(34,211,238,.22)", borderRadius: 12,
                padding: 14, maxHeight: "calc(100% - 24px)", overflowY: "auto",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em"}}>
                    {selectedSensor ? "CAPTEUR IoT" : "ALERTE RÉSEAU"}
                  </span>
                  <button onClick={() => {setSelectedSensor(null); setSelectedAlert(null)}}
                    style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:18,lineHeight:1}}>✕</button>
                </div>
                {selectedSensor && <SensorDetail sensor={selectedSensor} />}
                {selectedAlert && !selectedSensor && <AlertDetail alert={selectedAlert} onFlyTo={flyTo} />}
              </div>
            )}
          </div>

          {/* ── ONGLET MOBILE : ALERTES ── */}
          {isMobile && mobileTab === "alertes" && (
            <div className="aq-sb" style={{flex:1,overflowY:"auto",padding:"12px 14px 24px"}}>

              {/* KPI urgence en 2 blocs */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{background:"#f8717112",border:"1px solid #f8717133",borderRadius:11,padding:"10px 12px"}}>
                  <div style={{color:"#f87171",fontSize:20,fontWeight:800}}>{critAlerts}</div>
                  <div style={{color:"#64748b",fontSize:10,marginTop:2}}>Alertes critiques</div>
                </div>
                <div style={{background:"#fbbf2412",border:"1px solid #fbbf2433",borderRadius:11,padding:"10px 12px"}}>
                  <div style={{color:"#fbbf24",fontSize:20,fontWeight:800}}>{totalLoss}</div>
                  <div style={{color:"#64748b",fontSize:10,marginTop:2}}>m³/h perdus</div>
                </div>
              </div>

              <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:10}}>
                INCIDENTS ACTIFS — {ALERTS.length}
              </p>

              {selectedAlert ? (
                <div>
                  <button onClick={() => setSelectedAlert(null)}
                    style={{color:"#60a5fa",background:"none",border:"none",cursor:"pointer",fontSize:12,marginBottom:10,padding:0}}>
                    ← Tous les incidents
                  </button>
                  <AlertDetail alert={selectedAlert} onFlyTo={flyTo} />
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {ALERTS.map(a => {
                    const c = SEV_COLOR[a.severity] ?? "#94a3b8"
                    return (
                      <div key={a.alert_id} className="aq-row"
                        onClick={() => setSelectedAlert(a)}
                        style={{
                          padding:"11px 13px", borderRadius:12, cursor:"pointer",
                          background:`${c}0d`, borderLeft:`4px solid ${c}`,
                          border:`1.5px solid ${c}22`, borderLeft:`4px solid ${c}`,
                          transition:"all .15s",
                        }}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                          <div style={{color:c,fontSize:13,fontWeight:700}}>⚠ {a.type}</div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{background:`${c}22`,color:c,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6}}>
                              {(a.probability * 100).toFixed(0)}% IA
                            </span>
                            <span style={{background:`${c}22`,color:c,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:6}}>
                              {a.severity}
                            </span>
                          </div>
                        </div>
                        <div style={{color:"#94a3b8",fontSize:11,marginBottom:3}}>📍 {a.location}</div>
                        {a.estimated_loss_m3h > 0 && (
                          <div style={{color:"#f87171",fontSize:10,marginBottom:3}}>
                            💧 Perte estimée : {a.estimated_loss_m3h} m³/h
                          </div>
                        )}
                        <div style={{color:"#475569",fontSize:10,lineHeight:1.4}}>{a.description}</div>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:"#334155"}}>
                          <span style={{fontWeight:600}}>{a.status}</span>
                          <span>{a.date}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ONGLET MOBILE : CAPTEURS ── */}
          {isMobile && mobileTab === "capteurs" && (
            <div className="aq-sb" style={{flex:1,overflowY:"auto",padding:"12px 14px 24px"}}>

              {/* Résumé statuts */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
                {[
                  {label:"Normaux",count:normalCount,color:"#34d399",bg:"#34d39912"},
                  {label:"En alerte",count:alerteCount,color:"#fbbf24",bg:"#fbbf2412"},
                  {label:"Critiques",count:critCount,color:"#f87171",bg:"#f8717112"},
                ].map(s => (
                  <div key={s.label} style={{background:s.bg,border:`1px solid ${s.color}33`,borderRadius:10,padding:"9px 10px",textAlign:"center"}}>
                    <div style={{color:s.color,fontSize:18,fontWeight:800}}>{s.count}</div>
                    <div style={{color:"#64748b",fontSize:9,marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filtres */}
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {([
                  {id:"all",label:"Tous"},
                  {id:"critique",label:"Critiques"},
                  {id:"alerte",label:"En alerte"},
                ] as const).map(f => (
                  <button key={f.id} className="aq-row"
                    onClick={() => setSensorFilter(f.id)}
                    style={{
                      flex:1, padding:"6px 0", borderRadius:8, border:"none", cursor:"pointer",
                      background: sensorFilter===f.id ? "rgba(34,211,238,.15)" : "rgba(255,255,255,.04)",
                      color: sensorFilter===f.id ? "#22d3ee" : "#475569",
                      fontSize:10, fontWeight: sensorFilter===f.id ? 700 : 500,
                      border: sensorFilter===f.id ? "1px solid rgba(34,211,238,.35)" : "1px solid transparent",
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>

              <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:10}}>
                CAPTEURS IoT — {filteredSensors.length}/{SENSORS.length}
              </p>

              {selectedSensor ? (
                <div>
                  <button onClick={() => setSelectedSensor(null)}
                    style={{color:"#60a5fa",background:"none",border:"none",cursor:"pointer",fontSize:12,marginBottom:10,padding:0}}>
                    ← Tous les capteurs
                  </button>
                  <SensorDetail sensor={selectedSensor} />
                  <button
                    onClick={() => flyTo(selectedSensor.lat, selectedSensor.lng)}
                    style={{
                      width:"100%",marginTop:12,padding:"10px",borderRadius:9,
                      background:"rgba(34,211,238,.12)",border:"1px solid rgba(34,211,238,.35)",
                      color:"#22d3ee",fontSize:11,fontWeight:700,cursor:"pointer",
                    }}>
                    📍 Voir sur la carte →
                  </button>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {filteredSensors.map(s => {
                    const c = s.status === "critique" ? "#f87171"
                            : s.status === "alerte"   ? "#fbbf24"
                            : SENSOR_COLORS[s.kind] ?? "#34d399"
                    const kindIcon: Record<string,string> = {acoustic:"🔊",pressure:"📊",flow:"💧",quality:"🧪",level:"📈",pump_health:"⚙"}
                    return (
                      <div key={s.sensor_id} className="aq-row"
                        onClick={() => setSelectedSensor(s)}
                        style={{
                          display:"flex", alignItems:"center", gap:10,
                          padding:"10px 12px", borderRadius:11, cursor:"pointer",
                          background:`${c}0d`, border:`1px solid ${c}22`,
                          borderLeft:`3px solid ${c}`, transition:"all .15s",
                        }}>
                        <span style={{fontSize:18,flexShrink:0}}>{kindIcon[s.kind]??"●"}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{color:"#e2e8f0",fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {s.name}
                          </div>
                          <div style={{color:"#475569",fontSize:10,marginTop:1}}>{s.zone} · {s.kind}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{color:c,fontSize:13,fontWeight:700}}>{s.value}</div>
                          <div style={{color:"#475569",fontSize:9}}>{s.unit}</div>
                        </div>
                        <div style={{width:8,height:8,borderRadius:"50%",background:c,boxShadow:`0 0 5px ${c}`,flexShrink:0,
                          animation: s.status!=="normal" ? "aqPulse 1.8s ease-out infinite" : "none"}} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ONGLET MOBILE : RÉSEAU ── */}
          {isMobile && mobileTab === "reseau" && (
            <div className="aq-sb" style={{flex:1,overflowY:"auto",padding:"12px 14px 24px"}}>

              {/* KPIs réseau */}
              <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:10}}>
                ÉTAT DU RÉSEAU
              </p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[
                  {label:"Débit total",    value:`${Math.round(totalFlow)} m³/h`, color:"#22d3ee"},
                  {label:"Perte estimée",  value:`${totalLoss} m³/h`,             color: totalLoss > 0 ? "#f87171" : "#34d399"},
                  {label:"Conduites",      value:`${PIPES.length}`,               color:"#94a3b8"},
                  {label:"Nœuds",          value:`${NODES.length}`,               color:"#94a3b8"},
                  {label:"Capteurs IoT",   value:`${SENSORS.length}`,             color:"#94a3b8"},
                  {label:"Alertes actives",value:`${ALERTS.length}`,              color: ALERTS.length > 0 ? "#fbbf24" : "#34d399"},
                ].map(item => (
                  <div key={item.label} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(34,211,238,.08)",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{color:item.color,fontSize:18,fontWeight:800}}>{item.value}</div>
                    <div style={{color:"#475569",fontSize:10,marginTop:2}}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Nœuds principaux */}
              <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:10}}>
                NŒUDS PRINCIPAUX
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
                {NODES.map(node => {
                  const meta = NODE_META[node.type] ?? {sym:"●",color:"#64748b"}
                  return (
                    <div key={node.id} className="aq-row"
                      onClick={() => flyTo(node.lat, node.lng, 16)}
                      style={{
                        display:"flex", alignItems:"center", gap:10,
                        padding:"9px 11px", borderRadius:10, cursor:"pointer",
                        background:`${meta.color}0d`, border:`1px solid ${meta.color}22`,
                        transition:"all .15s",
                      }}>
                      <span style={{fontSize:16,color:meta.color,flexShrink:0}}>{meta.sym}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:"#e2e8f0",fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {node.name}
                        </div>
                        <div style={{color:"#475569",fontSize:10,marginTop:1}}>
                          {node.zone}
                          {(node as any).capacity_m3 ? ` · ${((node as any).capacity_m3/1000).toFixed(0)}k m³` : ""}
                          {(node as any).flow_m3h ? ` · ${(node as any).flow_m3h} m³/h` : ""}
                          {(node as any).open_pct != null ? ` · ${(node as any).open_pct}% ouvert` : ""}
                        </div>
                      </div>
                      <span style={{color:"#22d3ee",fontSize:11,flexShrink:0}}>→</span>
                    </div>
                  )
                })}
              </div>

              {/* Conduites à risque */}
              <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:10}}>
                CONDUITES À RISQUE
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {PIPES.filter((p: any) => p.risk === "high" || p.risk === "medium").map((p: any) => {
                  const c = p.risk === "high" ? "#f87171" : "#fbbf24"
                  return (
                    <div key={p.id} style={{
                      padding:"8px 11px", borderRadius:9,
                      background:`${c}0d`, borderLeft:`3px solid ${c}`,
                      border:`1px solid ${c}22`, borderLeft:`3px solid ${c}`,
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{color:c,fontSize:11,fontWeight:700}}>{p.id}</span>
                        <span style={{color:c,fontSize:10,fontWeight:600}}>{p.risk === "high" ? "Risque élevé" : "Risque moyen"}</span>
                      </div>
                      <div style={{color:"#94a3b8",fontSize:10}}>
                        {p.from} → {p.to} · ∅{p.diameter_mm}mm · {p.material}
                        {p.age_years ? ` · ${p.age_years} ans` : ""}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{color:"#1e3a5f",fontSize:10,textAlign:"center",marginTop:16,borderTop:"1px solid rgba(34,211,238,.06)",paddingTop:10}}>
                Synchro : {clock}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR DESKTOP — contenu complet
// ─────────────────────────────────────────────────────────────────────────────
function DesktopSidebar({
  clock, totalFlow, critCount, alerteCount, normalCount, totalLoss,
  selectedSensor, selectedAlert,
  onSelectSensor, onSelectAlert, onClear,
}: {
  clock: string; totalFlow: number
  critCount: number; alerteCount: number; normalCount: number; totalLoss: number
  selectedSensor: any; selectedAlert: any
  onSelectSensor: (s: any) => void; onSelectAlert: (a: any) => void; onClear: () => void
}) {
  return (
    <>
      <p style={{color:"#22d3ee",fontSize:10,fontWeight:700,letterSpacing:"0.15em",margin:0}}>AQUAPULSE — OPÉRATEUR</p>

      {/* Panneau détail si sélection */}
      {(selectedSensor || selectedAlert) && (
        <div style={{borderBottom:"1px solid rgba(34,211,238,.1)",paddingBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em"}}>
              {selectedSensor ? "CAPTEUR IoT" : "ALERTE RÉSEAU"}
            </span>
            <button onClick={onClear}
              style={{color:"#475569",background:"none",border:"none",cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
          </div>
          {selectedSensor && <SensorDetail sensor={selectedSensor} />}
          {selectedAlert && !selectedSensor && <AlertDetail alert={selectedAlert} onFlyTo={() => {}} />}
        </div>
      )}

      {/* KPIs réseau */}
      <div>
        <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:8}}>RÉSEAU</p>
        {[
          {l:"Débit total",    v:`${Math.round(totalFlow)} m³/h`},
          {l:"Perte estimée",  v:`${totalLoss} m³/h`, alert: totalLoss > 0},
          {l:"Conduites",      v:`${PIPES.length}`},
          {l:"Nœuds",          v:`${NODES.length}`},
          {l:"Synchro",        v:clock},
        ].map(x => (
          <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(34,211,238,.07)"}}>
            <span style={{color:"#64748b",fontSize:11}}>{x.l}</span>
            <span style={{color: x.alert ? "#f87171" : "#e2e8f0",fontSize:11,fontWeight:600}}>{x.v}</span>
          </div>
        ))}
      </div>

      {/* Capteurs */}
      <div>
        <p style={{color:"#22d3ee",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:6}}>
          CAPTEURS IoT &nbsp;
          <span style={{color:"#34d399"}}>{normalCount}✓</span>{" "}
          <span style={{color:"#fbbf24"}}>{alerteCount}⚠</span>{" "}
          <span style={{color:"#f87171"}}>{critCount}✕</span>
        </p>
        <div className="aq-sb" style={{maxHeight:190,overflowY:"auto",display:"flex",flexDirection:"column",gap:3}}>
          {SENSORS.filter(s => ["pressure","flow","acoustic","pump_health"].includes(s.kind)).map(s => {
            const c = s.status === "critique" ? "#f87171" : s.status === "alerte" ? "#fbbf24" : "#34d399"
            return (
              <div key={s.sensor_id}
                onClick={() => onSelectSensor(s)}
                style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"5px 8px", borderRadius:5, cursor:"pointer",
                  background: selectedSensor?.sensor_id===s.sensor_id ? `${c}18` : "transparent",
                  border:`1px solid ${selectedSensor?.sensor_id===s.sensor_id ? c+"44" : "transparent"}`,
                  transition:"all .15s",
                }}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:c,boxShadow:`0 0 4px ${c}`,flexShrink:0,
                    animation: s.status!=="normal" ? "aqPulse 2s ease-out infinite" : "none"
                  }}/>
                  <span style={{color:"#94a3b8",fontSize:10,maxWidth:138,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                </div>
                <span style={{color:c,fontSize:10,fontWeight:700,flexShrink:0}}>{s.value} {s.unit}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Alertes */}
      <div>
        <p style={{color:"#f87171",fontSize:9,fontWeight:700,letterSpacing:"0.15em",marginBottom:6}}>
          ALERTES <span style={{background:"#f8717133",borderRadius:3,padding:"1px 5px"}}>{ALERTS.length}</span>
        </p>
        {ALERTS.map(a => {
          const c = SEV_COLOR[a.severity] ?? "#94a3b8"
          return (
            <div key={a.alert_id}
              onClick={() => onSelectAlert(a)}
              style={{
                padding:"7px 9px", borderRadius:6, cursor:"pointer", marginBottom:5,
                background: selectedAlert?.alert_id===a.alert_id ? `${c}0d` : "transparent",
                borderTop:`1px solid ${c}22`, borderRight:`1px solid ${c}22`,
                borderBottom:`1px solid ${c}22`, borderLeft:`3px solid ${c}`,
                transition:"all .15s",
              }}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:c,fontSize:11,fontWeight:700}}>⚠ {a.type}</span>
                <span style={{color:c,fontSize:10,fontWeight:700}}>{(a.probability*100).toFixed(0)}%</span>
              </div>
              <div style={{color:"#64748b",fontSize:10,marginTop:2}}>{a.location}</div>
              {a.estimated_loss_m3h > 0 && (
                <div style={{color:"#f87171",fontSize:10,marginTop:1}}>Perte : {a.estimated_loss_m3h} m³/h</div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DÉTAIL CAPTEUR
// ─────────────────────────────────────────────────────────────────────────────
function SensorDetail({sensor}: {sensor: any}) {
  const c = sensor.status === "critique" ? "#f87171"
          : sensor.status === "alerte"   ? "#fbbf24"
          : SENSOR_COLORS[sensor.kind] ?? "#34d399"
  return (
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      <div style={{color:c,fontSize:13,fontWeight:700}}>{sensor.name}</div>
      <div style={{color:"#64748b",fontSize:11}}>{sensor.zone} · {sensor.kind}</div>
      <div style={{background:`${c}18`,border:`1px solid ${c}44`,borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
        <div style={{color:c,fontSize:26,fontWeight:800,lineHeight:1}}>{sensor.value}</div>
        <div style={{color:"#64748b",fontSize:11,marginTop:3}}>{sensor.unit}</div>
      </div>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:5,background:`${c}22`,border:`1px solid ${c}44`,alignSelf:"flex-start"}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:c}}/>
        <span style={{color:c,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{sensor.status}</span>
      </div>
      <div style={{color:"#334155",fontSize:10}}>ID : {sensor.sensor_id}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DÉTAIL ALERTE
// ─────────────────────────────────────────────────────────────────────────────
function AlertDetail({alert, onFlyTo}: {alert: any; onFlyTo: (lat: number, lng: number) => void}) {
  const c = SEV_COLOR[alert.severity] ?? "#94a3b8"
  return (
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      <div style={{color:c,fontSize:13,fontWeight:700}}>⚠ {alert.type}</div>
      <div style={{color:"#e2e8f0",fontSize:12}}>📍 {alert.location}</div>
      <div style={{background:`${c}18`,border:`1px solid ${c}44`,borderRadius:8,padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:"#64748b",fontSize:11}}>Probabilité IA</span>
          <span style={{color:c,fontSize:14,fontWeight:800}}>{(alert.probability*100).toFixed(0)}%</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:"#64748b",fontSize:11}}>Statut</span>
          <span style={{color:"#e2e8f0",fontSize:11,fontWeight:600}}>{alert.status}</span>
        </div>
        {alert.estimated_loss_m3h > 0 && (
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{color:"#64748b",fontSize:11}}>Perte estimée</span>
            <span style={{color:"#f87171",fontSize:11,fontWeight:700}}>{alert.estimated_loss_m3h} m³/h</span>
          </div>
        )}
        {alert.pipe_id && (
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{color:"#64748b",fontSize:11}}>Conduite</span>
            <span style={{color:"#22d3ee",fontSize:11}}>{alert.pipe_id}</span>
          </div>
        )}
      </div>
      <div style={{color:"#64748b",fontSize:11,lineHeight:1.6}}>{alert.description}</div>
      <div style={{color:"#334155",fontSize:10}}>{alert.date}</div>
      <button
        onClick={() => onFlyTo(alert.lat, alert.lng)}
        style={{
          padding:"9px",borderRadius:8,
          background:"rgba(34,211,238,.1)",border:"1px solid rgba(34,211,238,.3)",
          color:"#22d3ee",fontSize:11,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}>
        📍 Localiser sur la carte
      </button>
    </div>
  )
}
