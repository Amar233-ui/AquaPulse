"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"

const DakarCitizenMap = dynamic(
  () => import("@/components/map/dakar-citizen-map").then(m => ({ default: m.DakarCitizenMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement de la carte…</p>
        </div>
      </div>
    ),
  }
)

export default function CitoyenCartePage() {
  return (
    <DashboardLayout role="citoyen" title="Carte Interactive" fullscreen>
      <style>{`
        @media (max-width: 1023px) { .aq-map-wrap { height: calc(100dvh - 9.5rem) !important; } }
      `}</style>
      <div
        className="aq-map-wrap rounded-xl border border-border/60 bg-card shadow-lg overflow-hidden"
        style={{ height: "calc(100dvh - 5.5rem)", isolation: "isolate" }}
      >
        <DakarCitizenMap />
      </div>
    </DashboardLayout>
  )
}
