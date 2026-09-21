import { cn } from "@/lib/utils"

const steps = ["Shop Details", "Location", "Business", "WhatsApp"]

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="px-6 pb-2 pt-4">
      <div className="flex items-center gap-1.5">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1.5 rounded-full transition-colors",
                index <= step ? "bg-primary" : "bg-muted"
              )}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        Step {step + 1} of {steps.length} · {steps[step]}
      </p>
    </div>
  )
}
