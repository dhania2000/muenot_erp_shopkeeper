import { Check, MessageCircle, Users, Package } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const plans = [
  {
    name: "Starter",
    price: "Free",
    features: ["100 messages/month", "1 team member", "50 products"],
    current: false,
  },
  {
    name: "Growth",
    price: "₹999/month",
    features: ["5,000 messages/month", "5 team members", "Unlimited products", "Campaigns & automations"],
    current: true,
  },
  {
    name: "Pro",
    price: "₹2,499/month",
    features: ["25,000 messages/month", "Unlimited team members", "Advanced reports", "Priority support"],
    current: false,
  },
]

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader title="Subscription" backHref="/more" />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Current Plan</p>
              <p className="text-lg font-semibold text-foreground">Growth</p>
            </div>
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
              Active
            </Badge>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Renews on Nov 4, 2026</p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Usage this month</h2>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MessageCircle className="size-3.5" /> Messages
              </span>
              <span className="font-medium text-foreground">3,240 / 5,000</span>
            </div>
            <Progress value={65} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3.5" /> Team Members
              </span>
              <span className="font-medium text-foreground">3 / 5</span>
            </div>
            <Progress value={60} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="size-3.5" /> Products
              </span>
              <span className="font-medium text-foreground">156 / Unlimited</span>
            </div>
            <Progress value={20} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Available Plans</h2>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col gap-3 rounded-2xl border p-4 ${
                plan.current ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">{plan.price}</p>
                </div>
                {plan.current ? <Badge>Current</Badge> : null}
              </div>
              <ul className="flex flex-col gap-1.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              {!plan.current ? (
                <Button variant="outline" className="rounded-full">
                  Upgrade Plan
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
