"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Megaphone } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { templates } from "@/lib/mock-data"

const steps = ["Details", "Audience", "Template", "Schedule", "Review"]
const audiences = ["All customers (412)", "VIP customers (58)", "Regular customers (140)", "New customers (34)"]

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [audience, setAudience] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<"now" | "later">("now")
  const [scheduledFor, setScheduledFor] = useState("")
  const [creating, setCreating] = useState(false)

  const approvedTemplates = templates.filter((t) => t.status === "approved")
  const selectedTemplate = templates.find((t) => t.id === templateId)

  const canContinue =
    (step === 0 && name.trim().length > 1) ||
    (step === 1 && Boolean(audience)) ||
    (step === 2 && Boolean(templateId)) ||
    (step === 3 && (schedule === "now" || scheduledFor.trim().length > 0)) ||
    step === 4

  function handleContinue() {
    if (step === steps.length - 1) {
      setCreating(true)
      setTimeout(() => {
        setCreating(false)
        toast.success("Campaign created")
        router.push("/more/campaigns")
      }, 900)
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader
        title="New Campaign"
        onBack={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
        subtitle={`Step ${step + 1} of ${steps.length} · ${steps[step]}`}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
        {step === 0 ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="campaign-name">Campaign Name</FieldLabel>
              <Input
                id="campaign-name"
                placeholder="e.g. Diwali Mega Sale"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </FieldGroup>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-2">
            {audiences.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition-colors",
                  audience === a ? "border-primary bg-primary/5 text-foreground" : "border-border text-foreground"
                )}
              >
                {a}
                {audience === a ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-2">
            {approvedTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  "flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors",
                  templateId === t.id ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  {templateId === t.id ? <Check className="size-4 text-primary" /> : null}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{t.body}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setSchedule("now")}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition-colors",
                schedule === "now" ? "border-primary bg-primary/5 text-foreground" : "border-border text-foreground"
              )}
            >
              Send Immediately
              {schedule === "now" ? <Check className="size-4 text-primary" /> : null}
            </button>
            <button
              type="button"
              onClick={() => setSchedule("later")}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition-colors",
                schedule === "later" ? "border-primary bg-primary/5 text-foreground" : "border-border text-foreground"
              )}
            >
              Schedule for Later
              {schedule === "later" ? <Check className="size-4 text-primary" /> : null}
            </button>
            {schedule === "later" ? (
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="mt-1"
              />
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Campaign Name</p>
              <p className="text-sm font-medium text-foreground">{name}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Audience</p>
              <p className="text-sm font-medium text-foreground">{audience}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Template</p>
              <p className="text-sm font-medium text-foreground">{selectedTemplate?.name}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Schedule</p>
              <p className="text-sm font-medium text-foreground">
                {schedule === "now" ? "Send immediately" : scheduledFor}
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted/50 p-3.5">
              <Megaphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                This campaign will be sent only to eligible, consented recipients
                using this approved WhatsApp template.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border bg-background px-4 py-4">
        <Button
          size="lg"
          className="h-12 w-full rounded-full text-base"
          disabled={!canContinue || creating}
          onClick={handleContinue}
        >
          {creating ? "Creating..." : step === steps.length - 1 ? "Create Campaign" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
