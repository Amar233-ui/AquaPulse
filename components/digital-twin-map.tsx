"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { ZoomIn, ZoomOut, Maximize2, Layers, Info } from "lucide-react"
import { useState } from "react"
import { useApiQuery } from "@/hooks/use-api-query"
import type { MapData, MapNode } from "@/lib/types"

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

const typeIcons: Record<string, { shape: string; color: string; size: number }> = {
  reservoir: { shape: "rect", color: "oklch(0.45 0.15 240)", size: 14 },
  pump: { shape: "circle", color: "oklch(0.70 0.15 195)", size: 10 },
  sensor: { shape: "diamond", color: "oklch(0.65 0.10 200)", size: 8 },
  valve: { shape: "triangle", color: "oklch(0.55 0.12 220)", size: 9 },
  junction: { shape: "circle", color: "oklch(0.50 0.03 240)", size: 6 },
}

const statusColors: Record<string, string> = {
  normal: "oklch(0.65 0.18 155)",
  alerte: "oklch(0.75 0.15 70)",
  critique: "oklch(0.577 0.245 27.325)",
}

function getNodePos(node: MapNode) {
  return { x: node.x, y: node.y }
}

export function DigitalTwinMap() {
  const [selected, setSelected] = useState<MapNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const { data } = useApiQuery<MapData>("/api/map", {
    nodes: DEFAULT_NODES,
    connections: DEFAULT_CONNECTIONS,
  })
  const nodes = data.nodes
  const connections = data.connections

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Map Panel */}
        <Card className="border border-border/60 shadow-sm lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Jumeau Numerique - Vue Reseau</CardTitle>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(zoom + 0.2, 2))}>
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom avant</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(zoom - 0.2, 0.6))}>
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom arriere</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(1)}>
                <Maximize2 className="h-4 w-4" />
                <span className="sr-only">Reinitialiser</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Layers className="h-4 w-4" />
                <span className="sr-only">Couches</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-lg border border-border/40 bg-foreground/[0.03]" style={{ height: "500px" }}>
              {/* Grid background */}
              <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.90 0.02 230)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                {/* Connections */}
                {connections.map(([from, to], i) => {
                  const fromNode = nodes.find(n => n.id === from)
                  const toNode = nodes.find(n => n.id === to)
                  if (!fromNode || !toNode) return null
                  const f = getNodePos(fromNode)
                  const t = getNodePos(toNode)
                  const isAlerted = fromNode.status !== "normal" || toNode.status !== "normal"
                  return (
                    <line
                      key={`conn-${i}`}
                      x1={f.x}
                      y1={f.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={isAlerted ? statusColors.alerte : "oklch(0.75 0.05 230)"}
                      strokeWidth={isAlerted ? 0.4 : 0.25}
                      strokeDasharray={isAlerted ? "1 0.5" : "none"}
                      opacity={0.6}
                    />
                  )
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const { size } = typeIcons[node.type]
                  const fillColor = node.status === "normal" ? typeIcons[node.type].color : statusColors[node.status]
                  const isSelected = selected?.id === node.id
                  const r = size / 10

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelected(node)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.label} - ${node.status}`}
                    >
                      {/* Pulse for alerts */}
                      {node.status !== "normal" && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={r + 0.8}
                          fill="none"
                          stroke={statusColors[node.status]}
                          strokeWidth="0.15"
                          opacity="0.5"
                        >
                          <animate attributeName="r" values={`${r + 0.5};${r + 2};${r + 0.5}`} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Selection ring */}
                      {isSelected && (
                        <circle cx={node.x} cy={node.y} r={r + 0.6} fill="none" stroke="oklch(0.70 0.15 195)" strokeWidth="0.2" />
                      )}

                      {/* Node shape */}
                      {node.type === "reservoir" ? (
                        <rect
                          x={node.x - r}
                          y={node.y - r * 0.7}
                          width={r * 2}
                          height={r * 1.4}
                          rx={0.3}
                          fill={fillColor}
                          opacity={0.9}
                        />
                      ) : node.type === "valve" ? (
                        <polygon
                          points={`${node.x},${node.y - r} ${node.x + r},${node.y + r * 0.6} ${node.x - r},${node.y + r * 0.6}`}
                          fill={fillColor}
                          opacity={0.9}
                        />
                      ) : (
                        <circle cx={node.x} cy={node.y} r={r} fill={fillColor} opacity={0.9} />
                      )}

                      {/* Label */}
                      <text
                        x={node.x}
                        y={node.y + r + 1.8}
                        textAnchor="middle"
                        fill="oklch(0.50 0.03 240)"
                        fontSize="1.5"
                        fontWeight="500"
                      >
                        {node.id}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 rounded-lg border border-border/60 bg-card/90 px-3 py-2 backdrop-blur-sm">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Legende</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(typeIcons).map(([type, { color }]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] capitalize text-muted-foreground">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Panel */}
        <div className="space-y-4">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Info className="h-4 w-4 text-accent" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selected.label}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{selected.type}</Badge>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selected.data && Object.entries(selected.data).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-md border border-border/40 bg-secondary/30 px-3 py-2">
                        <span className="text-xs capitalize text-muted-foreground">{key}</span>
                        <span className="text-xs font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID: {selected.id} | Position: ({selected.x}, {selected.y})
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {"Selectionnez un element sur la carte pour voir ses details."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Network Summary */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Resume Reseau</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Noeuds actifs", value: `${nodes.length}` },
                { label: "Connexions", value: `${connections.length}` },
                { label: "Alertes", value: `${nodes.filter(n => n.status === "alerte").length}` },
                { label: "Critiques", value: `${nodes.filter(n => n.status === "critique").length}` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
