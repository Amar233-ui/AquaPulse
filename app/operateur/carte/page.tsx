"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DakarWaterMap } from "@/components/map/dakar-water-map"

export default function OperateurCartePage() {
  return (
    <DashboardLayout role="operateur" title="Jumeau Numérique">
      <DakarWaterMap />
    </DashboardLayout>
  )
}