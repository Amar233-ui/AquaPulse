"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ZoomIn, ZoomOut, Maximize2, AlertTriangle, CheckCircle, XCircle, Droplets, MapPin, X } from "lucide-react"
import { useState } from "react"
import { useApiQuery } from "@/hooks/use-api-query"
import type { MapData, MapNode } from "@/lib/types"

// ── Données mock ───────────────────────────────────────────────────────────────
const DEFAULT_NODES: MapNode[] = [
  { id: "R1", x: 15, y: 12, type: "reservoir", label: "Reservoir Nord", status: "normal", data: { niveau: "82%", capacite: "50,000 m3" } },
  { id: "R2", x: 80, y: 75, type: "reservoir", label: "Reservoir Sud", status: "normal", data: { niveau: "74%", capacite: "35,000 m3" } },
  { id: "P1", x: 30, y: 25, type: "pump", label: "Station Pompage Nord", status: "normal", data: { debit: "1,200 m3/h", pression: "3.4 bar" } },
  { id: "P2", x: 65, y: 60, type: "pump", label: "Station Est", status: "critique", data: { debit: "450 m3/h", pression: "2.1 bar" } },
  { id: "S1", x: 45, y: 18, type: "sensor", label: "Capteur Debit #112", status: "normal", data: { valeur: "1,050 m3/h", batterie: "92%" } },
  { id: "S2", x: 50, y: 45, type: "sensor", label: "Capteur Qualite #89", status: "alerte", data: { pH: "6.8", turbidite: "1.2 NTU" } },
  { id: "S3", x: 25, y: 55, type: "sensor", label: "Capteur Pression #45", status: "normal", data: { valeur: "3.1 bar", batterie: "78%" } },
  { id: "V1", x: 38, y: 35, type: "valve", label: "Vanne V-12", status: "normal", data: { ouverture: "100%", debit: "800 m3/h" } },
  { id: "V2", x: 58, y: 50, type: "valve", label: "Vanne V-28", status: "alerte", data: { ouverture: "45%", debit: "320 m3/h" } },
  { id: "J1", x: 42, y: 42, type: "junction", label: "Noeud Central", status: "normal", data: { connexions: "6", debit: "2,400 m3/h" } },
  { id: "J2", x: 70, y: 30, type: "junction", label: "Noeud Est", status: "normal", data: { connexions: "4", debit: "1,100 m3/h" } },
  { id: "S4", x: 72, y: 45, type: "sensor", label: "Capteur Acoustique #7", status: "normal", data: { valeur: "Stable", batterie: "85%" } },
  { id: "P3", x: 20, y: 70, type: "pump", label: "Station Ouest", status: "normal", data: { debit: "980 m3/h", pression: "3.2 bar" } },
]

const DEFAULT_CONNECTIONS: [string, string][] = [
  ["R1", "P1"], ["P1", "V1"], ["V1", "J1"], ["J1", "S2"],
  ["S1", "J1"], ["J1", "V2"], ["V2", "P2"], ["P2", "R2"],
  ["J1", "J2"], ["J2", "S4"], ["S3", "P3"], ["P3", "J1"],
  ["R1", "S1"],
]

// ── Traduction pour le citoyen ─────────────────────────────────────────────────
const typeLabels: Record<string, string> = {
  reservoir: "Réservoir d'eau",
  pump: "Station de pompage",
  sensor: "Point de surveillance",
  valve: "Vanne de distribution",
  junction: "Carrefour du réseau",
}

const statusInfo: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  normal:   { label: "Fonctionnel",    color: "#2dd4bf", bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.3)", icon: "✅" },
  alerte:   { label: "À surveiller",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", icon: "⚠️" },
  critique: { label: "Problème détecté", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", icon: "🔴" },
}

// Message citoyen selon le type + statut
function getCitizenMessage(node: MapNode): { title: string; desc: string } {
  if (node.status === "normal") {
    const msgs: Record<string, string> = {
      reservoir: "Ce réservoir fonctionne normalement et alimente votre quartier.",
      pump: "Cette station pompe l'eau normalement vers le réseau.",
      sensor: "Ce point de surveillance ne détecte aucune anomalie.",
      valve: "Cette vanne distribue l'eau normalement.",
      junction: "Ce carrefour achemine l'eau normalement.",
    }
    return { title: typeLabels[node.type], desc: msgs[node.type] }
  }
  if (node.status === "alerte") {
    const msgs: Record<string, string> = {
      reservoir: "Ce réservoir présente une légère anomalie. Les équipes sont informées.",
      pump: "Cette station pompe à débit réduit. Peut affecter la pression dans le secteur.",
      sensor: "Ce point détecte une anomalie en cours d'analyse. Votre eau reste utilisable.",
      valve: "Cette vanne est partiellement fermée. Une intervention est planifiée.",
      junction: "Ce carrefour présente un débit inhabituel. Surveillance en cours.",
    }
    return { title: typeLabels[node.type] + " — À surveiller", desc: msgs[node.type] }
  }
  // critique
  const msgs: Record<string, string> = {
    reservoir: "Ce réservoir est hors service. Un réservoir de secours prend le relais.",
    pump: "Cette station est en panne. Cela peut causer une baisse de pression dans votre quartier.",
    sensor: "Ce point de surveillance est défaillant. Une intervention urgente est en cours.",
    valve: "Cette vanne est bloquée. Une équipe technique intervient en urgence.",
    junction: "Ce carrefour est critique. Une intervention urgente est en cours.",
  }
  return { title: typeLabels[node.type] + " — Problème détecté", desc: msgs[node.type] }
}

const nodeColors: Record<string, { normal: string; shape: string }> = {
  reservoir: { normal: "#3b82f6", shape: "rect" },
  pump:      { normal: "#2dd4bf", shape: "circle" },
  sensor:    { normal: "#94a3b8", shape: "diamond" },
  valve:     { normal: "#a78bfa", shape: "triangle" },
  junction:  { normal: "#64748b", shape: "circle" },
}

export function CitizenTwinMap() {
  const [selected, setSelected] = useState<MapNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const { data } = useApiQuery<MapData>("/api/map", {
    nodes: DEFAULT_NODES,
    connections: DEFAULT_CONNECTIONS,
  })
  const nodes = data.nodes
  const connections = data.connections

  const alertCount = nodes.filter(n => n.status === "alerte").length
  const critiqueCount = nodes.filter(n => n.status === "critique").length
  const totalProblems = alertCount + critiqueCount

  return (
    <div className="space-y-4">

      {/* Banner statut global */}
      <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${
        critiqueCount > 0
          ? "border-red-500/30 bg-red-50 dark:bg-red-950/20"
          : alertCount > 0
          ? "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
          : "border-teal-500/30 bg-teal-50 dark:bg-teal-950/20"
      }`}>
        {critiqueCount > 0
          ? <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          : alertCount > 0
          ? <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          : <CheckCircle className="h-5 w-5 text-teal-500 flex-shrink-0" />
        }
        <div>
          <p className="font-semibold text-sm">
            {totalProblems === 0
              ? "Réseau entièrement fonctionnel"
              : `${totalProblems} point${totalProblems > 1 ? "s" : ""} en anomalie sur le réseau`
            }
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalProblems === 0
              ? "Aucune perturbation détectée sur votre réseau d'eau"
              : "Cliquez sur un point coloré pour savoir ce que ça signifie pour vous"
            }
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">

        {/* Carte */}
        <Card className="border border-border/60 shadow-sm lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Réseau d'eau — Vue en direct</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Cliquez sur un élément pour en savoir plus</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card hover:bg-secondary/50 transition-colors"
                onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card hover:bg-secondary/50 transition-colors"
                onClick={() => setZoom(Math.max(zoom - 0.2, 0.6))}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card hover:bg-secondary/50 transition-colors"
                onClick={() => setZoom(1)}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-xl border border-border/40 bg-slate-50 dark:bg-slate-900/40" style={{ height: "480px" }}>

              {/* Grille de fond */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none">
                <defs>
                  <pattern id="citizengrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/30" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#citizengrid)" />
              </svg>

              {/* SVG réseau */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                {/* Connexions */}
                {connections.map(([from, to], i) => {
                  const fromNode = nodes.find(n => n.id === from)
                  const toNode = nodes.find(n => n.id === to)
                  if (!fromNode || !toNode) return null
                  const hasIssue = fromNode.status !== "normal" || toNode.status !== "normal"
                  const isCritique = fromNode.status === "critique" || toNode.status === "critique"
                  return (
                    <line
                      key={`c-${i}`}
                      x1={fromNode.x} y1={fromNode.y}
                      x2={toNode.x} y2={toNode.y}
                      stroke={isCritique ? "#ef4444" : hasIssue ? "#f59e0b" : "#94a3b8"}
                      strokeWidth={hasIssue ? 0.5 : 0.3}
                      strokeDasharray={hasIssue ? "1.5 0.8" : "none"}
                      opacity={hasIssue ? 0.7 : 0.4}
                    />
                  )
                })}

                {/* Noeuds */}
                {nodes.map((node) => {
                  const isSelected = selected?.id === node.id
                  const color = node.status === "normal"
                    ? nodeColors[node.type]?.normal ?? "#94a3b8"
                    : node.status === "alerte" ? "#f59e0b" : "#ef4444"
                  const r = node.type === "reservoir" ? 1.4 : node.type === "pump" ? 1.1 : 0.8

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelected(selected?.id === node.id ? null : node)}
                      className="cursor-pointer"
                    >
                      {/* Pulse pour alertes */}
                      {node.status !== "normal" && (
                        <circle cx={node.x} cy={node.y} r={r + 0.5} fill="none" stroke={color} strokeWidth="0.2" opacity="0.4">
                          <animate attributeName="r" values={`${r + 0.3};${r + 2.2};${r + 0.3}`} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Sélection */}
                      {isSelected && (
                        <circle cx={node.x} cy={node.y} r={r + 0.9} fill="none" stroke="#2dd4bf" strokeWidth="0.3" />
                      )}

                      {/* Forme */}
                      {node.type === "reservoir" ? (
                        <rect x={node.x - r} y={node.y - r * 0.75} width={r * 2} height={r * 1.5} rx={0.4} fill={color} opacity={0.9} />
                      ) : node.type === "valve" ? (
                        <polygon
                          points={`${node.x},${node.y - r} ${node.x + r},${node.y + r * 0.7} ${node.x - r},${node.y + r * 0.7}`}
                          fill={color} opacity={0.9}
                        />
                      ) : (
                        <circle cx={node.x} cy={node.y} r={r} fill={color} opacity={0.9} />
                      )}

                      {/* Label */}
                      <text
                        x={node.x} y={node.y + r + 2}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="1.6"
                        fontWeight="500"
                      >
                        {node.id}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Légende simplifiée */}
              <div className="absolute bottom-3 left-3 rounded-lg border border-border/50 bg-card/95 px-3 py-2 backdrop-blur-sm shadow-sm">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">État du réseau</p>
                <div className="flex flex-col gap-1">
                  {[
                    { color: "#2dd4bf", label: "Fonctionnel" },
                    { color: "#f59e0b", label: "À surveiller" },
                    { color: "#ef4444", label: "Problème" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Types légende */}
              <div className="absolute bottom-3 right-3 rounded-lg border border-border/50 bg-card/95 px-3 py-2 backdrop-blur-sm shadow-sm">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Éléments</p>
                <div className="flex flex-col gap-1">
                  {[
                    { color: "#3b82f6", label: "Réservoir" },
                    { color: "#2dd4bf", label: "Station pompage" },
                    { color: "#a78bfa", label: "Vanne" },
                    { color: "#94a3b8", label: "Surveillance" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panneau détail */}
        <div className="space-y-4">

          {/* Info sélection */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="h-4 w-4 text-accent" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (() => {
                const info = statusInfo[selected.status]
                const msg = getCitizenMessage(selected)
                return (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{msg.title}</p>
                      <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Statut badge citoyen */}
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                      style={{ background: info.bg, border: `1px solid ${info.border}` }}
                    >
                      <span className="text-base">{info.icon}</span>
                      <span className="text-sm font-medium" style={{ color: info.color }}>{info.label}</span>
                    </div>

                    {/* Description humaine */}
                    <p className="text-sm text-muted-foreground leading-relaxed">{msg.desc}</p>

                    {/* ID technique discret */}
                    <p className="text-[10px] text-muted-foreground/50 border-t border-border/30 pt-2">
                      Réf. technique : {selected.id}
                    </p>
                  </div>
                )
              })() : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <Droplets className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur un élément de la carte pour en savoir plus.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résumé simplifié */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">État global</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "Points fonctionnels",
                  value: nodes.filter(n => n.status === "normal").length,
                  color: "text-teal-500",
                },
                {
                  label: "À surveiller",
                  value: alertCount,
                  color: "text-amber-500",
                },
                {
                  label: "En anomalie",
                  value: critiqueCount,
                  color: "text-red-500",
                },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}

              <div className="pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground text-center">
                  Mis à jour il y a 2 min
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
