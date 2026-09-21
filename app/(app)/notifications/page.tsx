import { MessageCircle, ShoppingBag, IndianRupee, Megaphone, AlertTriangle, BellOff } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { notifications } from "@/lib/mock-data"
import type { NotificationItem } from "@/lib/types"

const iconMap: Record<NotificationItem["type"], typeof MessageCircle> = {
  message: MessageCircle,
  order: ShoppingBag,
  payment: IndianRupee,
  campaign: Megaphone,
  whatsapp: AlertTriangle,
}

const toneMap: Record<NotificationItem["type"], string> = {
  message: "bg-info/10 text-info",
  order: "bg-primary/10 text-primary",
  payment: "bg-success/10 text-success",
  campaign: "bg-warning/15 text-warning-foreground",
  whatsapp: "bg-destructive/10 text-destructive",
}

export default function NotificationsPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader title="Notifications" backHref="/home" />

      {notifications.length > 0 ? (
        <div className="divide-y divide-border">
          {notifications.map((n) => {
            const Icon = iconMap[n.type]
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5",
                  !n.read && "bg-primary/5"
                )}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", toneMap[n.type])}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                </div>
                {!n.read ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : null}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellOff />
              </EmptyMedia>
              <EmptyTitle>No notifications yet</EmptyTitle>
              <EmptyDescription>We&apos;ll let you know when something happens.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}
    </div>
  )
}
