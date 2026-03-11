"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useEffect, useRef, useCallback } from "react"
import { Play, RotateCcw, Download, Droplets, Thermometer, CloudRain, AlertTriangle, Zap, Activity, Gauge, ChevronDown, ChevronUp } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts"

// ── Types ─────────────────────────────────────────────────────────────────────
interface SimParams {
  scenario: string
  drought: number       // 0–100 : réduction offre
  population: number    // 0–50  : % croissance demande
  leakRate: number      // 0–40  : % pertes réseau
  pumpPower: number     // 20–100: % puissance pompes
  duration: "24h" | "7j" | "30j"
}

interface SimPoint { hour: string; demand: number; supply: number; stress: number; loss: number }
interface SimMetrics { avgStress: number; peaks: number; reservoirPct: number; lostM3: number; coverageRate: number }

// ── Calcul simulation côté client (instantané, pas d'API nécessaire) ─────────
function computeSimulation(p: SimParams): { points: SimPoint[]; metrics: SimMetrics } {
  const BASE_DEMAND  = [100, 65, 145, 185, 165, 135, 95]
  const BASE_SUPPLY  = [120, 120, 125, 155, 145, 135, 120]
  const LABELS_24H   = ["00h", "04h", "08h", "12h", "16h", "20h", "24h"]

  const droughtPenalty    = Math.max(0.45, 1 - p.drought / 130)
  const populationBoost   = 1 + p.population / 100
  const leakMultiplier    = 1 - p.leakRate / 100
  const pumpMultiplier    = p.pumpPower / 100

  const points: SimPoint[] = BASE_DEMAND.map((bd, i) => {
    const demand = Math.round(bd * populationBoost * (1 + p.drought / 200))
    const supply = Math.round(BASE_SUPPLY[i] * droughtPenalty * pumpMultiplier)
    const loss   = Math.round(supply * (p.leakRate / 100))
    const netSupply = Math.round(supply * leakMultiplier)
    const stress = Math.max(0, Math.round(((demand - netSupply) / Math.max(netSupply, 1)) * 100))
    return { hour: LABELS_24H[i], demand, supply: netSupply, stress, loss }
  })

  const avgStress = Math.round(points.reduce((s, p) => s + p.stress, 0) / points.length)
  const peaks = points.filter(p => p.stress > 30).length
  const reservoirPct = Math.max(10, Math.round(85 - p.drought * 0.6 - p.leakRate * 0.3))
  const lostM3 = Math.round(points.reduce((s, p) => s + p.loss, 0) * 4) // × 4h
  const coverageRate = Math.round(Math.min(100, (points.reduce((s, p) => s + p.supply, 0) / points.reduce((s, p) => s + p.demand, 0)) * 100))

  return { points, metrics: { avgStress, peaks, reservoirPct, lostM3, coverageRate } }
}

// ── Noeuds réseau SVG ─────────────────────────────────────────────────────────
const NET_NODES = [
  { id: "R1", x: 120, y: 60,  type: "reservoir", label: "Château Plateau" },
  { id: "R2", x: 80,  y: 220, type: "reservoir", label: "Réservoir Médina" },
  { id: "R3", x: 540, y: 80,  type: "reservoir", label: "Réservoir Pikine" },
  { id: "P1", x: 200, y: 130, type: "pump",      label: "Pompe Fann" },
  { id: "P2", x: 300, y: 230, type: "pump",      label: "Pompe HLM" },
  { id: "P3", x: 430, y: 160, type: "pump",      label: "Pompe Parcelles" },
  { id: "V1", x: 150, y: 200, type: "valve",     label: "Vanne Médina" },
  { id: "V2", x: 360, y: 280, type: "valve",     label: "Vanne Gd Dakar" },
  { id: "J1", x: 250, y: 170, type: "junction",  label: "Nœud Plateau" },
  { id: "J2", x: 390, y: 240, type: "junction",  label: "Nœud HLM" },
  { id: "J3", x: 490, y: 190, type: "junction",  label: "Nœud Pikine" },
]

const NET_PIPES = [
  { from: "R1", to: "P1" }, { from: "P1", to: "J1" }, { from: "J1", to: "V1" },
  { from: "V1", to: "R2" }, { from: "R2", to: "J1" }, { from: "J1", to: "J2" },
  { from: "J2", to: "P2" }, { from: "P2", to: "V2" }, { from: "V2", to: "P3" },
  { from: "P3", to: "J2" }, { from: "P3", to: "J3" }, { from: "J3", to: "R3" },
  { from: "R3", to: "J3" }, { from: "J2", to: "J3" },
]

const NODE_MAP = Object.fromEntries(NET_NODES.map(n => [n.id, n]))

// ── Composant Slider custom ───────────────────────────────────────────────────
function ParamSlider({
  label, icon: Icon, value, min, max, step, unit, color = "#22d3ee",
  onChange, danger,
}: {
  label: string; icon: any; value: number; min: number; max: number
  step: number; unit: string; color?: string; onChange: (v: number) => void; danger?: boolean
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: danger && value > max * 0.6 ? "#f87171" : color }} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color: danger && value > max * 0.6 ? "#f87171" : color }}>
          {value}{unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-secondary cursor-pointer" onClick={e => {
        const rect = e.currentTarget.getBoundingClientRect()
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        onChange(Math.round((min + pct * (max - min)) / step) * step)
      }}>
        <div className="absolute h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: danger && value > max * 0.6 ? "#f87171" : color }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
        <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 bg-background transition-all duration-150"
          style={{ left: `calc(${pct}% - 8px)`, borderColor: danger && value > max * 0.6 ? "#f87171" : color }} />
      </div>
      <div className="flex justify-between text-[10px] text-foreground/40">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function SimulateurPage() {
  const [params, setParams] = useState<SimParams>({
    scenario: "custom",
    drought: 20,
    population: 10,
    leakRate: 8,
    pumpPower: 90,
    duration: "24h",
  })
  const [result, setResult] = useState(() => computeSimulation({
    scenario: "custom", drought: 20, population: 10, leakRate: 8, pumpPower: 90, duration: "24h"
  }))
  const [running, setRunning] = useState(false)
  const [animated, setAnimated] = useState(false)
  const [visiblePoints, setVisiblePoints] = useState(7)
  const animRef = useRef<any>(null)

  // Recalcul instantané à chaque changement de paramètre
  const updateParam = useCallback(<K extends keyof SimParams>(key: K, val: SimParams[K]) => {
    const newParams = { ...params, [key]: val }
    setParams(newParams)
    setResult(computeSimulation(newParams))
  }, [params])

  // Simulation "animée" avec progression des points
  const handleRun = () => {
    setRunning(true)
    setAnimated(false)
    setVisiblePoints(1)
    const full = computeSimulation(params)
    setResult(full)
    let i = 1
    animRef.current = setInterval(() => {
      i++
      setVisiblePoints(i)
      if (i >= full.points.length) {
        clearInterval(animRef.current)
        setRunning(false)
        setAnimated(true)
      }
    }, 220)
  }

  const handleReset = () => {
    clearInterval(animRef.current)
    setRunning(false)
    setAnimated(false)
    setVisiblePoints(7)
    const defaults: SimParams = { scenario: "custom", drought: 20, population: 10, leakRate: 8, pumpPower: 90, duration: "24h" }
    setParams(defaults)
    setResult(computeSimulation(defaults))
  }

  // Appliquer scénario preset
  const applyScenario = (sc: string) => {
    const presets: Record<string, Partial<SimParams>> = {
      secheresse:     { drought: 65, population: 5,  leakRate: 10, pumpPower: 75 },
      inondation:     { drought: 0,  population: 0,  leakRate: 25, pumpPower: 60 },
      contamination:  { drought: 30, population: 0,  leakRate: 5,  pumpPower: 80 },
      panne:          { drought: 10, population: 0,  leakRate: 15, pumpPower: 30 },
      croissance:     { drought: 10, population: 40, leakRate: 12, pumpPower: 90 },
      custom:         {},
    }
    const newParams = { ...params, scenario: sc, ...presets[sc] }
    setParams(newParams)
    setResult(computeSimulation(newParams))
  }

  const { points, metrics } = result
  const visibleData = points.slice(0, visiblePoints)

  const stressColor = metrics.avgStress > 40 ? "#f87171" : metrics.avgStress > 20 ? "#fbbf24" : "#34d399"
  const coverageColor = metrics.coverageRate < 70 ? "#f87171" : metrics.coverageRate < 90 ? "#fbbf24" : "#34d399"

  // Couleur pipe selon stress
  const getPipeColor = (from: string, to: string) => {
    if (params.leakRate > 25 || params.drought > 60) return "#f87171"
    if (params.leakRate > 15 || params.drought > 40) return "#fbbf24"
    return "#22d3ee"
  }
  const getPipeWidth = (from: string) => {
    const pumps = ["P1","P2","P3"]
    return pumps.includes(from) ? 3 : 1.5
  }

  return (
    <DashboardLayout role="operateur" title="Simulateur de Stress Hydrique" fullscreen>
      <div style={{ fontFamily: "'JetBrains Mono', monospace" }} className="h-full">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&display=swap');
          .sim-panel { background: oklch(0.18 0.02 240); border: 1px solid oklch(0.28 0.03 240); border-radius: 10px; }
          .sim-scroll::-webkit-scrollbar { width: 3px; }
          .sim-scroll::-webkit-scrollbar-thumb { background: rgba(34,211,238,.3); border-radius: 2px; }
          .node-pump { animation: pumpSpin 3s linear infinite; transform-origin: center; }
          @keyframes pumpSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .pipe-flow { stroke-dasharray: 8 4; animation: pipeFlow 1.5s linear infinite; }
          @keyframes pipeFlow { 0% { stroke-dashoffset: 48; } 100% { stroke-dashoffset: 0; } }
        `}</style>

        <div className="grid gap-3 h-full" style={{ gridTemplateColumns: "1fr 320px", gridTemplateRows: "1fr" }}>

          {/* ── Colonne gauche : réseau + graphiques ── */}
          <div className="flex flex-col gap-3 min-h-0">

            {/* Réseau SVG */}
            <div className="sim-panel flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs font-bold tracking-wider text-foreground/80">JUMEAU NUMÉRIQUE — SIMULATION EN COURS</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/50">
                  <span>Scénario: <span className="text-accent font-bold">{params.scenario.toUpperCase()}</span></span>
                  <span className="font-mono">{new Date().toLocaleTimeString("fr-FR")}</span>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative p-2">
                <svg width="100%" height="100%" viewBox="0 0 640 320" preserveAspectRatio="xMidYMid meet">
                  {/* Grille de fond */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,211,238,0.05)" strokeWidth="0.5"/>
                    </pattern>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <rect width="640" height="320" fill="url(#grid)" />

                  {/* Pipes */}
                  {NET_PIPES.map((pipe, i) => {
                    const from = NODE_MAP[pipe.from]
                    const to = NODE_MAP[pipe.to]
                    if (!from || !to) return null
                    const color = getPipeColor(pipe.from, pipe.to)
                    const width = getPipeWidth(pipe.from)
                    return (
                      <g key={i}>
                        {/* Pipe de fond */}
                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.to}
                          x2={to.x} y2={to.y}
                          stroke={color} strokeWidth={width + 2} strokeOpacity={0.1} />
                        {/* Pipe principal */}
                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                          stroke={color} strokeWidth={width} strokeOpacity={0.8}
                          className={running ? "pipe-flow" : ""}
                          strokeDasharray={running ? "8 4" : "none"}
                        />
                      </g>
                    )
                  })}

                  {/* Noeuds */}
                  {NET_NODES.map(node => {
                    const isPump = node.type === "pump"
                    const isReservoir = node.type === "reservoir"
                    const isValve = node.type === "valve"
                    const color = isReservoir ? "#38bdf8" : isPump ? "#fbbf24" : isValve ? "#a78bfa" : "#64748b"
                    const lowPump = isPump && params.pumpPower < 50
                    const finalColor = lowPump ? "#f87171" : color
                    return (
                      <g key={node.id} filter="url(#glow)">
                        {/* Halo */}
                        <circle cx={node.x} cy={node.y} r={isReservoir ? 22 : 16}
                          fill={finalColor} fillOpacity={0.08} stroke={finalColor} strokeWidth={1} strokeOpacity={0.3} />
                        {/* Corps */}
                        {isReservoir ? (
                          <rect x={node.x - 13} y={node.y - 13} width={26} height={26} rx={4}
                            fill={`${finalColor}22`} stroke={finalColor} strokeWidth={1.5} />
                        ) : isPump ? (
                          <circle cx={node.x} cy={node.y} r={12}
                            fill={`${finalColor}22`} stroke={finalColor} strokeWidth={1.5}
                            className={running && params.pumpPower > 20 ? "node-pump" : ""} />
                        ) : (
                          <polygon points={`${node.x},${node.y - 11} ${node.x + 10},${node.y + 7} ${node.x - 10},${node.y + 7}`}
                            fill={`${finalColor}22`} stroke={finalColor} strokeWidth={1.5} />
                        )}
                        {/* Icône texte */}
                        <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="11" fill={finalColor} fontFamily="monospace">
                          {isReservoir ? "▣" : isPump ? "⚙" : isValve ? "◈" : "◎"}
                        </text>
                        {/* Label */}
                        <text x={node.x} y={node.y + 26} textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.8)" fontFamily="monospace">
                          {node.id}
                        </text>
                        {/* Badge status */}
                        {lowPump && (
                          <circle cx={node.x + 10} cy={node.y - 10} r={4} fill="#f87171" />
                        )}
                      </g>
                    )
                  })}

                  {/* Légende */}
                  <g transform="translate(10, 280)">
                    {[
                      { color: "#38bdf8", label: "Réservoir" },
                      { color: "#fbbf24", label: "Pompe" },
                      { color: "#a78bfa", label: "Vanne" },
                      { color: "#22d3ee", label: "Conduite OK" },
                      { color: "#f87171", label: "Conduite critique" },
                    ].map((item, i) => (
                      <g key={item.label} transform={`translate(${i * 110}, 0)`}>
                        <rect width={8} height={8} rx={2} fill={item.color} y={-4} />
                        <text x={12} y={4} fontSize="9" fill="rgba(148,163,184,0.7)" fontFamily="monospace">{item.label}</text>
                      </g>
                    ))}
                  </g>
                </svg>
              </div>
            </div>

            {/* Graphique résultats */}
            <div className="sim-panel" style={{ height: 220 }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
                <span className="text-xs font-bold tracking-wider text-foreground/80">DÉBIT & STRESS HYDRIQUE</span>
                <div className="flex gap-4 text-[10px] text-foreground/50">
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-accent" />Demande</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-400" />Offre nette</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400" />Stress %</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={165}>
                <AreaChart data={visibleData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="sG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.18 0.02 240)", border: "1px solid oklch(0.28 0.03 240)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                  />
                  {metrics.avgStress > 20 && <ReferenceLine y={130} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1} />}
                  <Area type="monotone" dataKey="demand" stroke="#22d3ee" fill="url(#dG)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="supply" stroke="#38bdf8" fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Area type="monotone" dataKey="stress" stroke="#f87171" fill="url(#sG)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Colonne droite : paramètres + KPIs ── */}
          <div className="sim-scroll flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 5.5rem)" }}>

            {/* Sélecteur scénario */}
            <div className="sim-panel p-4">
              <p className="text-[10px] font-bold tracking-widest text-foreground/50 mb-3">SCÉNARIO PRÉDÉFINI</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "custom",      label: "Personnalisé", color: "#22d3ee" },
                  { id: "secheresse",  label: "🌡 Sécheresse",   color: "#f87171" },
                  { id: "inondation",  label: "🌊 Inondation",   color: "#38bdf8" },
                  { id: "contamination",label:"⚠ Contamination", color: "#fbbf24" },
                  { id: "panne",       label: "⚡ Panne Pompes", color: "#a78bfa" },
                  { id: "croissance",  label: "📈 Croissance",   color: "#34d399" },
                ].map(sc => (
                  <button key={sc.id} onClick={() => applyScenario(sc.id)}
                    className="rounded-lg px-2 py-2 text-xs font-semibold text-left transition-all"
                    style={{
                      background: params.scenario === sc.id ? `${sc.color}20` : "transparent",
                      border: `1px solid ${params.scenario === sc.id ? sc.color + "60" : "oklch(0.28 0.03 240)"}`,
                      color: params.scenario === sc.id ? sc.color : "rgba(148,163,184,0.8)",
                    }}>
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders paramètres */}
            <div className="sim-panel p-4 space-y-5">
              <p className="text-[10px] font-bold tracking-widest text-foreground/50">PARAMÈTRES</p>

              <ParamSlider label="Sécheresse" icon={Thermometer}
                value={params.drought} min={0} max={100} step={5} unit="%"
                color="#f87171" danger
                onChange={v => updateParam("drought", v)} />

              <ParamSlider label="Croissance Population" icon={Activity}
                value={params.population} min={0} max={50} step={1} unit="%"
                color="#fbbf24"
                onChange={v => updateParam("population", v)} />

              <ParamSlider label="Pertes Réseau (fuites)" icon={Droplets}
                value={params.leakRate} min={0} max={40} step={1} unit="%"
                color="#a78bfa" danger
                onChange={v => updateParam("leakRate", v)} />

              <ParamSlider label="Puissance Pompes" icon={Zap}
                value={params.pumpPower} min={20} max={100} step={5} unit="%"
                color="#34d399"
                onChange={v => updateParam("pumpPower", v)} />
            </div>

            {/* KPIs temps réel */}
            <div className="sim-panel p-4">
              <p className="text-[10px] font-bold tracking-widest text-foreground/50 mb-3">RÉSULTATS TEMPS RÉEL</p>
              <div className="space-y-3">
                {[
                  { label: "Stress Hydrique Moyen", value: `${metrics.avgStress}%`,       color: stressColor,   icon: CloudRain },
                  { label: "Taux de Couverture",    value: `${metrics.coverageRate}%`,    color: coverageColor, icon: Gauge },
                  { label: "Pics de Déficit",       value: `${metrics.peaks} / 7 créneaux`, color: metrics.peaks > 3 ? "#f87171" : "#fbbf24", icon: AlertTriangle },
                  { label: "Volume Perdu",          value: `${metrics.lostM3} m³`,         color: metrics.lostM3 > 1000 ? "#f87171" : "#fbbf24", icon: Droplets },
                  { label: "Niveau Réservoirs",     value: `${metrics.reservoirPct}%`,     color: metrics.reservoirPct < 30 ? "#f87171" : "#34d399", icon: Activity },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ background: `${item.color}0d`, border: `1px solid ${item.color}22` }}>
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                      <span className="text-xs text-foreground/70">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons action */}
            <div className="sim-panel p-4 space-y-2">
              <button onClick={handleRun} disabled={running}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-60"
                style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.4)", color: "#22d3ee" }}>
                <Play className="h-4 w-4" />
                {running ? "Simulation en cours…" : "▶ Lancer la Simulation"}
              </button>
              <div className="flex gap-2">
                <button onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all"
                  style={{ background: "transparent", border: "1px solid oklch(0.28 0.03 240)", color: "rgba(148,163,184,0.8)" }}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Réinitialiser
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all"
                  style={{ background: "transparent", border: "1px solid oklch(0.28 0.03 240)", color: "rgba(148,163,184,0.8)" }}>
                  <Download className="h-3.5 w-3.5" />
                  Exporter
                </button>
              </div>
            </div>

            {/* Indicateur santé globale */}
            <div className="sim-panel p-4">
              <p className="text-[10px] font-bold tracking-widest text-foreground/50 mb-3">SANTÉ GLOBALE DU RÉSEAU</p>
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0">
                  <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="oklch(0.28 0.03 240)" strokeWidth="6" />
                    <circle cx="32" cy="32" r="26" fill="none"
                      stroke={metrics.coverageRate > 90 ? "#34d399" : metrics.coverageRate > 70 ? "#fbbf24" : "#f87171"}
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${(metrics.coverageRate / 100) * 163} 163`}
                      style={{ transition: "stroke-dasharray 0.5s ease" }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold" style={{ color: metrics.coverageRate > 90 ? "#34d399" : metrics.coverageRate > 70 ? "#fbbf24" : "#f87171" }}>
                      {metrics.coverageRate}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {metrics.coverageRate > 90 ? "Réseau stable" : metrics.coverageRate > 70 ? "Sous pression" : "Situation critique"}
                  </p>
                  <p className="text-xs text-foreground/55 mt-0.5 leading-relaxed">
                    {metrics.coverageRate > 90
                      ? "L'offre couvre la demande sur l'ensemble du réseau."
                      : metrics.coverageRate > 70
                      ? "Des déficits ponctuels sont à prévoir. Prévenez les équipes."
                      : "Intervention urgente requise. Activez le plan de crise."}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
