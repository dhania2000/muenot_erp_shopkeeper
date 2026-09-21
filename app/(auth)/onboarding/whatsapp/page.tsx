"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, CheckCircle2, AlertTriangle, Clock } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { WhatsAppStatus } from "@/lib/types"
import { StatusBadge, whatsappStatusTone, whatsappStatusLabel } from "@/components/status-badge"

export default function WhatsAppSetupStep() {
  const router = useRouter()
  const [status, setStatus] = useState<WhatsAppStatus>("not-connected")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

  function connect() {
    setStatus("connecting")
    timers.current.push(
      setTimeout(() => {
        setStatus("registration-pending")
        timers.current.push(
          setTimeout(() => {
            setStatus("connected")
          }, 1800)
        )
      }, 1400)
    )
  }

  const isBusy = status === "connecting" || status === "registration-pending"

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader title="Shop Setup" backHref="/onboarding/business" />
      <OnboardingProgress step={3} />
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="flex flex-col items-center gap-4 pb-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-8" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Connect your WhatsApp
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Connect your business WhatsApp number to receive and reply to
              customer messages from Muenot.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              {status === "connected" ? (
                <CheckCircle2 className="size-5 text-success" />
              ) : status === "not-connected" ? (
                <MessageCircle className="size-5 text-muted-foreground" />
              ) : isBusy ? (
                <Clock className="size-5 text-warning-foreground" />
              ) : (
                <AlertTriangle className="size-5 text-destructive" />
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                WhatsApp Business
              </p>
              <p className="text-xs text-muted-foreground">
                {status === "not-connected"
                  ? "Not connected yet"
                  : whatsappStatusLabel(status)}
              </p>
            </div>
          </div>
          <StatusBadge tone={whatsappStatusTone(status)}>
            {isBusy ? "In progress" : status === "connected" ? "Ready" : "Pending"}
          </StatusBadge>
        </div>

        <div className="mt-auto flex flex-col gap-3 pb-8 pt-8">
          {status === "connected" ? (
            <Button
              size="lg"
              className="h-12 w-full rounded-full text-base"
              onClick={() => router.push("/home")}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                className="h-12 w-full rounded-full text-base"
                onClick={connect}
                disabled={isBusy}
              >
                {isBusy ? <Spinner /> : null}
                {isBusy ? "Connecting..." : "Connect WhatsApp"}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 w-full rounded-full text-base"
                onClick={() => router.push("/home")}
                disabled={isBusy}
              >
                Do This Later
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
