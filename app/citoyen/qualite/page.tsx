"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const phData = [
  { time: "00h", value: 7.1 }, { time: "04h", value: 7.2 }, { time: "08h", value: 7.3 },
  { time: "12h", value: 7.2 }, { time: "16h", value: 7.1 }, { time: "20h", value: 7.2 }, { time: "24h", value: 7.2 },
]

const turbidityData = [
  { time: "00h", value: 0.7 }, { time: "04h", value: 0.8 }, { time: "08h", value: 0.9 },
  { time: "12h", value: 0.8 }, { time: "16h", value: 0.7 }, { time: "20h", value: 0.8 }, { time: "24h", value: 0.8 },
]

const parameters = [
  { label: "pH", value: "7.2", unit: "", status: "normal" as const, min: "6.5", max: "8.5", description: "Le pH mesure l'acidite ou la basicite de l'eau." },
  { label: "Turbidite", value: "0.8", unit: "NTU", status: "normal" as const, min: "0", max: "1", description: "La turbidite mesure la clarte de l'eau." },
  { label: "Chlore residuel", value: "0.5", unit: "mg/L", status: "normal" as const, min: "0.2", max: "0.8", description: "Le chlore residuel assure la desinfection de l'eau." },
  { label: "Temperature", value: "18.5", unit: "C", status: "normal" as const, min: "10", max: "25", description: "La temperature de l'eau distribuee." },
  { label: "Conductivite", value: "420", unit: "uS/cm", status: "normal" as const, min: "200", max: "800", description: "La conductivite mesure la mineralisation de l'eau." },
  { label: "Coliformes", value: "0", unit: "CFU/100mL", status: "normal" as const, min: "0", max: "0", description: "Absence de bacteries coliformes." },
]

export default function QualitePage() {
  return (
    <DashboardLayout role="citoyen" title="Qualite de l'Eau">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parameters.map((param) => (
            <Card key={param.label} className="border border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{param.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {param.value} <span className="text-sm font-normal text-muted-foreground">{param.unit}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {"Norme: "}{param.min} - {param.max} {param.unit}
                    </p>
                  </div>
                  <StatusBadge status={param.status} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{param.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evolution du pH (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={phData}>
                  <defs>
                    <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.70 0.15 195)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={[6.5, 8.5]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.70 0.15 195)" fill="url(#phGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evolution de la Turbidite (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={turbidityData}>
                  <defs>
                    <linearGradient id="turbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.45 0.15 240)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.45 0.15 240)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 2]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.45 0.15 240)" fill="url(#turbGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
