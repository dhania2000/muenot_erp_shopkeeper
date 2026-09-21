"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

const initialHours = [
  { day: "Monday", open: "10:00 AM", close: "9:00 PM", enabled: true },
  { day: "Tuesday", open: "10:00 AM", close: "9:00 PM", enabled: true },
  { day: "Wednesday", open: "10:00 AM", close: "9:00 PM", enabled: true },
  { day: "Thursday", open: "10:00 AM", close: "9:00 PM", enabled: true },
  { day: "Friday", open: "10:00 AM", close: "9:00 PM", enabled: true },
  { day: "Saturday", open: "10:00 AM", close: "9:00 PM", enabled: true },
  { day: "Sunday", open: "11:00 AM", close: "6:00 PM", enabled: false },
]

export default function BusinessHoursPage() {
  const [hours, setHours] = useState(initialHours)

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Business Hours" backHref="/more/settings" />
      <div className="flex flex-col gap-2 px-4 py-4">
        {hours.map((h, index) => (
          <div key={h.day} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <Switch
              checked={h.enabled}
              onCheckedChange={(v) =>
                setHours((prev) => prev.map((p, i) => (i === index ? { ...p, enabled: v } : p)))
              }
            />
            <span className="w-24 text-sm font-medium text-foreground">{h.day}</span>
            {h.enabled ? (
              <div className="flex flex-1 items-center gap-1.5">
                <Input
                  className="h-8 text-xs"
                  value={h.open}
                  onChange={(e) =>
                    setHours((prev) => prev.map((p, i) => (i === index ? { ...p, open: e.target.value } : p)))
                  }
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  className="h-8 text-xs"
                  value={h.close}
                  onChange={(e) =>
                    setHours((prev) => prev.map((p, i) => (i === index ? { ...p, close: e.target.value } : p)))
                  }
                />
              </div>
            ) : (
              <span className="flex-1 text-xs text-muted-foreground">Closed</span>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 pb-8">
        <Button
          size="lg"
          className="h-12 w-full rounded-full text-base"
          onClick={() => toast.success("Business hours updated")}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}
