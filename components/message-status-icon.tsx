import { Check, CheckCheck, AlertCircle } from "lucide-react"
import type { MessageStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

export function MessageStatusIcon({ status }: { status?: MessageStatus }) {
  if (!status) return null

  if (status === "failed") {
    return <AlertCircle className="size-3.5 text-destructive" />
  }

  if (status === "sent") {
    return <Check className="size-3.5 text-primary-foreground/70" />
  }

  return (
    <CheckCheck
      className={cn(
        "size-3.5",
        status === "read" ? "text-primary-foreground" : "text-primary-foreground/70"
      )}
    />
  )
}
