"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MessageSquareText, Moon, PackageCheck, IndianRupee, Pencil } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Marker, MarkerContent } from "@/components/ui/marker"

const initialAutomations = [
  {
    id: "welcome",
    label: "Welcome Message",
    icon: MessageSquareText,
    enabled: true,
    when: "A new customer messages you for the first time",
    ifCond: "It is within business hours",
    then: 'Send "Welcome to our store! How can we help you today?"',
  },
  {
    id: "away",
    label: "Away Message",
    icon: Moon,
    enabled: true,
    when: "A customer messages you",
    ifCond: "It is outside business hours",
    then: 'Send "We are currently closed. We will reply during business hours."',
  },
  {
    id: "order-confirmation",
    label: "Order Confirmation",
    icon: PackageCheck,
    enabled: true,
    when: "A new order is created",
    ifCond: "Order total is greater than ₹0",
    then: "Send the order_confirmation template to the customer",
  },
  {
    id: "payment-reminder",
    label: "Payment Reminder",
    icon: IndianRupee,
    enabled: false,
    when: "An order has payment pending",
    ifCond: "24 hours have passed since order creation",
    then: "Send the payment_reminder template to the customer",
  },
]

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(initialAutomations)
  const [editing, setEditing] = useState<typeof initialAutomations[number] | null>(null)

  function toggle(id: string, value: boolean) {
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: value } : a)))
    toast.success(value ? "Automation enabled" : "Automation disabled")
  }

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Automations" backHref="/more" />

      <div className="flex flex-col gap-2.5 px-4 py-4">
        {automations.map((automation) => (
          <div key={automation.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <automation.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{automation.label}</p>
              <p className="truncate text-xs text-muted-foreground">{automation.when}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(automation)}>
              <Pencil />
              <span className="sr-only">Edit</span>
            </Button>
            <Switch
              checked={automation.enabled}
              onCheckedChange={(value) => toggle(automation.id, value)}
            />
          </div>
        ))}
      </div>

      <Sheet open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{editing?.label}</SheetTitle>
            <SheetDescription>How this automation works</SheetDescription>
          </SheetHeader>
          {editing ? (
            <div className="flex flex-col gap-3 px-4">
              <div className="rounded-2xl border border-border bg-card p-3.5">
                <Marker>
                  <MarkerContent className="text-xs font-semibold uppercase tracking-wide text-primary">
                    When
                  </MarkerContent>
                </Marker>
                <p className="mt-1 text-sm text-foreground">{editing.when}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3.5">
                <Marker>
                  <MarkerContent className="text-xs font-semibold uppercase tracking-wide text-primary">
                    If
                  </MarkerContent>
                </Marker>
                <p className="mt-1 text-sm text-foreground">{editing.ifCond}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3.5">
                <Marker>
                  <MarkerContent className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Then
                  </MarkerContent>
                </Marker>
                <p className="mt-1 text-sm text-foreground">{editing.then}</p>
              </div>
            </div>
          ) : null}
          <SheetFooter>
            <Button onClick={() => setEditing(null)}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
