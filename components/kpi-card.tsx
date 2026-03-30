import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { isValidElement, type ReactNode } from "react"

interface KPICardProps {
  title?: string
  label?: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon | ReactNode
  iconColor?: string
}

export function KPICard({ title, label, value, change, changeType = "neutral", icon, iconColor }: KPICardProps) {
  const cardTitle = title ?? label ?? ""
  const iconClassName = cn("h-5 w-5", iconColor ? "text-card-foreground" : "text-primary")
  const iconContent = isValidElement(icon)
    ? icon
    : (() => {
        const Icon = icon as LucideIcon
        return <Icon className={iconClassName} />
      })()

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{cardTitle}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <p className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}>
                {change}
              </p>
            )}
          </div>
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            iconColor || "bg-primary/10"
          )}>
            {iconContent}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
