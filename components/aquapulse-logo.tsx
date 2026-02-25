import { cn } from "@/lib/utils"

export function AquaPulseLogo({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizes = {
    sm: "h-6 w-6",
    default: "h-8 w-8",
    lg: "h-10 w-10",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center rounded-lg bg-primary", sizes[size])}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-primary-foreground"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1 w-3 rounded-full bg-primary-foreground/40 translate-y-1" />
        </div>
      </div>
      <span className={cn(
        "font-semibold tracking-tight",
        size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg"
      )}>
        AquaPulse
      </span>
    </div>
  )
}
