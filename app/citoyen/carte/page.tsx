"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DigitalTwinMap } from "@/components/digital-twin-map"

export default function CitoyenCartePage() {
  return (
    <DashboardLayout role="citoyen" title="Carte Interactive">
      <DigitalTwinMap />
    </DashboardLayout>
  )
}
