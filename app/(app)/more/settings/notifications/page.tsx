"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ScreenHeader } from "@/components/screen-header"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

const initialPrefs = [
  { id: "messages", label: "New WhatsApp Messages", description: "Get notified for every new customer message", enabled: true },
  { id: "orders", label: "New Orders", description: "Get notified when a new order is placed", enabled: true },
  { id: "payments", label: "Payments", description: "Get notified when payments are received", enabled: true },
  { id: "campaigns", label: "Campaign Updates", description: "Get notified when campaigns finish sending", enabled: false },
  { id: "whatsapp", label: "WhatsApp Connection Issues", description: "Critical alerts about your WhatsApp connection", enabled: true },
]

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState(initialPrefs)

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Notifications" backHref="/more/settings" />
      <div className="mx-4 mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {prefs.map((pref, index) => (
          <div key={pref.id}>
            <div className="flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Switch
                checked={pref.enabled}
                onCheckedChange={(v) => {
                  setPrefs((prev) => prev.map((p, i) => (i === index ? { ...p, enabled: v } : p)))
                  toast.success(`${pref.label} ${v ? "enabled" : "disabled"}`)
                }}
              />
            </div>
            {index < prefs.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
