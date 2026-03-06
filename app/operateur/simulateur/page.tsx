"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Download, Droplets, Thermometer, CloudRain, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

import { useApiQuery } from "@/hooks/use-api-query"

interface SimulationResponse {
  scenario: string
  duration: "24h" | "7j" | "30j" | "1a"
  points: Array<{ hour: string; demand: number; supply: number; stress: number }>
  metrics: {
    averageStress: number
    peaks: number
    reservoirCapacity: number
  }
}

const DEFAULT_DATA: SimulationResponse = {
  scenario: "Secheresse",
  duration: "24h",
  points: [
    { hour: "0h", demand: 100, supply: 120, stress: 10 },
    { hour: "4h", demand: 60, supply: 120, stress: 5 },
    { hour: "8h", demand: 140, supply: 120, stress: 25 },
    { hour: "12h", demand: 180, supply: 150, stress: 40 },
    { hour: "16h", demand: 160, supply: 140, stress: 30 },
    { hour: "20h", demand: 130, supply: 130, stress: 15 },
    { hour: "24h", demand: 90, supply: 120, stress: 8 },
  ],
  metrics: {
    averageStress: 19,
    peaks: 3,
    reservoirCapacity: 72,
  },
}

export default function SimulateurPage() {
  const { data, setData } = useApiQuery<SimulationResponse>("/api/operateur/simulateur", DEFAULT_DATA)
  const [scenario, setScenario] = useState("Secheresse")
  const [drought, setDrought] = useState([30])
  const [population, setPopulation] = useState([15])
  const [duration, setDuration] = useState<"24h" | "7j" | "30j" | "1a">("24h")
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setError(null)
    setRunning(true)

    try {
      const response = await fetch("/api/operateur/simulateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scenario,
          drought: drought[0],
          population: population[0],
          duration,
        }),
      })

      const json = (await response.json()) as {
        error?: string
        points?: SimulationResponse["points"]
        metrics?: SimulationResponse["metrics"]
      }

      if (!response.ok || !json.points || !json.metrics) {
        throw new Error(json.error ?? "Simulation impossible")
      }

      setData({
        scenario,
        duration,
        points: json.points,
        metrics: json.metrics,
      })
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Erreur inconnue")
    } finally {
      setRunning(false)
    }
  }

  return (
    <DashboardLayout role="operateur" title="Simulateur de Stress Hydrique">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Parametres de Simulation</CardTitle>
            <CardDescription>Configurez les variables du scenario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Scenario</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Secheresse">Secheresse prolongee</SelectItem>
                  <SelectItem value="Inondation">Inondation</SelectItem>
                  <SelectItem value="Contamination">Contamination</SelectItem>
                  <SelectItem value="Panne">Panne majeure</SelectItem>
                  <SelectItem value="Custom">Personnalise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  Secheresse
                </Label>
                <span className="text-sm font-medium">{drought[0]}%</span>
              </div>
              <Slider value={drought} onValueChange={setDrought} max={100} step={5} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  Croissance Population
                </Label>
                <span className="text-sm font-medium">{population[0]}%</span>
              </div>
              <Slider value={population} onValueChange={setPopulation} max={50} step={1} />
            </div>

            <div className="space-y-2">
              <Label>Duree de simulation</Label>
              <Select value={duration} onValueChange={(value) => setDuration(value as "24h" | "7j" | "30j" | "1a") }>
                <SelectTrigger>
                  <SelectValue placeholder="24 heures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 heures</SelectItem>
                  <SelectItem value="7j">7 jours</SelectItem>
                  <SelectItem value="30j">30 jours</SelectItem>
                  <SelectItem value="1a">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleRun}
                disabled={running}
              >
                <Play className="h-4 w-4" />
                {running ? "Simulation..." : "Lancer"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setScenario("Secheresse")
                  setDrought([30])
                  setPopulation([15])
                  setDuration("24h")
                  setError(null)
                }}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reinitialiser</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <CloudRain className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Stress Hydrique Moyen</p>
                  <p className="text-xl font-bold text-foreground">{data.metrics.averageStress}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Pics de Deficit</p>
                  <p className="text-xl font-bold text-foreground">{data.metrics.peaks}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <Droplets className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Capacite Reservoirs</p>
                  <p className="text-xl font-bold text-foreground">{data.metrics.reservoirCapacity}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Resultats de Simulation</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Scenario: {scenario}</Badge>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Demande (m3/h)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Offre (m3/h)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Stress (%)
                </span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.points}>
                  <defs>
                    <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.577 0.245 27.325)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="oklch(0.577 0.245 27.325)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="demand" stroke="oklch(0.70 0.15 195)" fill="url(#demandGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="supply" stroke="oklch(0.45 0.15 240)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="stress" stroke="oklch(0.577 0.245 27.325)" fill="url(#stressGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
