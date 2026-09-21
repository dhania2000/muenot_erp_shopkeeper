"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MessageCircle, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react"
import type { WhatsAppStatus } from "@/lib/types"
import { ScreenHeader } from "@/components/screen-header"
import { StatusBadge, whatsappStatusTone, whatsappStatusLabel } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { shop } from "@/lib/mock-data"

const explanations: Record<WhatsAppStatus, string> = {
  "not-connected": "Connect your business WhatsApp number to start receiving and replying to customer messages.",
  connecting: "We're connecting to WhatsApp. This usually takes a minute.",
  "registration-pending": "Your number is being verified with WhatsApp. This can take a few minutes.",
  connected: "Your WhatsApp Business number is connected and ready to send and receive messages.",
  "action-required": "We need you to complete a step to keep messaging working. Please retry setup.",
  failed: "We couldn't connect your WhatsApp number. Please try again.",
}

export default function WhatsAppSettingsPage() {
  const [status, setStatus] = useState<WhatsAppStatus>(shop.whatsappStatus)

  function retry() {
    setStatus("connecting")
    setTimeout(() => setStatus("registration-pending"), 1200)
    setTimeout(() => {
      setStatus("connected")
      toast.success("WhatsApp connected successfully")
    }, 2600)
  }

  const isBusy = status === "connecting" || status === "registration-pending"

  return (
    <div className="flex flex-col">
      <ScreenHeader title="WhatsApp" backHref="/more/settings" />

      <div className="flex flex-col items-center gap-3 px-4 pt-6 pb-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {status === "connected" ? (
            <CheckCircle2 className="size-8 text-success" />
          ) : isBusy ? (
            <Clock className="size-8 text-warning-foreground" />
          ) : status === "not-connected" ? (
            <MessageCircle className="size-8" />
          ) : (
            <AlertTriangle className="size-8 text-destructive" />
          )}
        </span>
        <StatusBadge tone={whatsappStatusTone(status)}>{whatsappStatusLabel(status)}</StatusBadge>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          {explanations[status]}
        </p>
      </div>

      <div className="mx-4 mb-5 divide-y divide-border rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between p-3.5">
          <span className="text-sm text-muted-foreground">Business Name</span>
          <span className="text-sm font-medium text-foreground">{shop.name}</span>
        </div>
        <div className="flex items-center justify-between p-3.5">
          <span className="text-sm text-muted-foreground">Phone Number</span>
          <span className="text-sm font-medium text-foreground">{shop.whatsappNumber}</span>
        </div>
        <div className="flex items-center justify-between p-3.5">
          <span className="text-sm text-muted-foreground">Messaging Status</span>
          <span className="text-sm font-medium text-foreground">
            {status === "connected" ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4">
        {status === "connected" ? (
          <>
            <Button variant="outline" className="h-12 w-full rounded-full" onClick={retry} disabled={isBusy}>
              <RefreshCw />
              Reconnect
            </Button>
            <AlertDialog>
              <AlertDialogTrigger className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-destructive/30 bg-destructive/5 text-sm font-medium text-destructive transition-colors active:bg-destructive/10">
                Disconnect WhatsApp
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect WhatsApp?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will stop receiving and sending WhatsApp messages until
                    you reconnect your number.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setStatus("not-connected")
                      toast.success("WhatsApp disconnected")
                    }}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <Button size="lg" className="h-12 w-full rounded-full text-base" onClick={retry} disabled={isBusy}>
            {isBusy ? <Spinner /> : null}
            {isBusy
              ? "Connecting..."
              : status === "not-connected"
                ? "Connect WhatsApp"
                : "Retry Setup"}
          </Button>
        )}
      </div>
    </div>
  )
}
