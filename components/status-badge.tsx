import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusType = "normal" | "alerte" | "critique" | "faible" | "moyen" | "actif" | "inactif"

const statusStyles: Record<StatusType, string> = {
  normal: "bg-success/15 text-success border-success/20",
  actif: "bg-success/15 text-success border-success/20",
  alerte: "bg-warning/15 text-warning-foreground border-warning/20",
  moyen: "bg-warning/15 text-warning-foreground border-warning/20",
  faible: "bg-chart-5/15 text-chart-3 border-chart-5/20",
  critique: "bg-destructive/15 text-destructive border-destructive/20",
  inactif: "bg-muted text-muted-foreground border-border",
}

const statusLabels: Record<StatusType, string> = {
  normal: "Normal",
  alerte: "Alerte",
  critique: "Critique",
  faible: "Faible",
  moyen: "Moyen",
  actif: "Actif",
  inactif: "Inactif",
}

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", statusStyles[status], className)}
    >
      <span className={cn(
        "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
        status === "normal" || status === "actif" ? "bg-success" :
        status === "alerte" || status === "moyen" ? "bg-warning" :
        status === "critique" ? "bg-destructive" :
        status === "faible" ? "bg-chart-5" : "bg-muted-foreground"
      )} />
      {statusLabels[status]}
    </Badge>
  )
}
