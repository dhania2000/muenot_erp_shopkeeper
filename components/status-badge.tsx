import { cn } from "@/lib/utils"

type Tone = "success" | "warning" | "info" | "danger" | "neutral" | "primary"

const toneClasses: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  info: "bg-info/10 text-info",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
}

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export function orderStatusTone(status: string): Tone {
  switch (status) {
    case "new":
      return "info"
    case "processing":
      return "warning"
    case "completed":
      return "success"
    case "cancelled":
      return "danger"
    default:
      return "neutral"
  }
}

export function paymentStatusTone(status: string): Tone {
  switch (status) {
    case "paid":
      return "success"
    case "pending":
      return "warning"
    case "cod":
      return "info"
    default:
      return "neutral"
  }
}

export function templateStatusTone(status: string): Tone {
  switch (status) {
    case "approved":
      return "success"
    case "pending":
      return "warning"
    case "rejected":
      return "danger"
    default:
      return "neutral"
  }
}

export function campaignStatusTone(status: string): Tone {
  switch (status) {
    case "running":
      return "info"
    case "scheduled":
      return "warning"
    case "completed":
      return "success"
    case "draft":
      return "neutral"
    default:
      return "neutral"
  }
}

export function whatsappStatusTone(status: string): Tone {
  switch (status) {
    case "connected":
      return "success"
    case "connecting":
    case "registration-pending":
      return "warning"
    case "action-required":
    case "failed":
      return "danger"
    default:
      return "neutral"
  }
}

export function whatsappStatusLabel(status: string): string {
  switch (status) {
    case "connected":
      return "Messaging ready"
    case "connecting":
      return "Connecting..."
    case "registration-pending":
      return "Registration pending"
    case "action-required":
      return "Action required"
    case "failed":
      return "Connection failed"
    default:
      return "Not connected"
  }
}
