import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  className,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: "primary" | "success" | "info" | "warning"
  className?: string
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    warning: "bg-warning/15 text-warning-foreground",
  }[tone]

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5",
        className
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full",
          toneClasses
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-lg font-semibold text-foreground leading-tight">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
