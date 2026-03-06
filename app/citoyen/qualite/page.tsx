"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useApiQuery } from "@/hooks/use-api-query"
import type { CitizenQualityData } from "@/lib/types"

const DEFAULT_QUALITY: CitizenQualityData = {
  phData: [],
  turbidityData: [],
  parameters: [],
}

export default function QualitePage() {
  const { data } = useApiQuery<CitizenQualityData>("/api/citoyen/qualite", DEFAULT_QUALITY)

  return (
    <DashboardLayout role="citoyen" title="Qualite de l'Eau">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.parameters.map((param) => (
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
                <AreaChart data={data.phData}>
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
                <AreaChart data={data.turbidityData}>
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
