"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"

const DakarWaterMap = dynamic(
  () => import("@/components/map/dakar-water-map").then(m => ({ default: m.DakarWaterMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement du jumeau numérique…</p>
        </div>
      </div>
    ),
  }
)

export default function OperateurCartePage() {
  return (
    <DashboardLayout role="operateur" title="Jumeau Numérique" fullscreen>
      <div
        className="rounded-xl border border-border/60 bg-card shadow-lg overflow-hidden"
        style={{ height: "calc(100vh - 5.5rem)" }}
      >
        <DakarWaterMap />
      </div>
    </DashboardLayout>
  )
}
