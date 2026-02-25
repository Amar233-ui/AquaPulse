"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DigitalTwinMap } from "@/components/digital-twin-map"

export default function OperateurCartePage() {
  return (
    <DashboardLayout role="operateur" title="Jumeau Numerique">
      <DigitalTwinMap />
    </DashboardLayout>
  )
}
