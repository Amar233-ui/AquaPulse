import { DashboardLayout } from "@/components/dashboard-layout"
import { DakarCitizenMap } from "@/components/map/dakar-citizen-map"

export default function CitoyenCartePage() {
  return (
    <DashboardLayout role="citoyen" title="Carte Interactive">
      <DakarCitizenMap />
    </DashboardLayout>
  )
}
