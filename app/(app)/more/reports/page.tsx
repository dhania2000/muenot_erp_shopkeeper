import { MessageCircle, Users, ShoppingBag, IndianRupee, Megaphone } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { MiniBarChart } from "@/components/mini-bar-chart"
import { Badge } from "@/components/ui/badge"

const weekly = [
  { label: "Mon", value: 32 },
  { label: "Tue", value: 41 },
  { label: "Wed", value: 28 },
  { label: "Thu", value: 55 },
  { label: "Fri", value: 47 },
  { label: "Sat", value: 63 },
  { label: "Sun", value: 38 },
]

const salesWeekly = [
  { label: "Mon", value: 8200 },
  { label: "Tue", value: 10400 },
  { label: "Wed", value: 6300 },
  { label: "Thu", value: 14800 },
  { label: "Fri", value: 12100 },
  { label: "Sat", value: 17600 },
  { label: "Sun", value: 12480 },
]

export default function ReportsPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader title="Reports" backHref="/more" />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-info/10 text-info">
                <MessageCircle className="size-4" />
              </span>
              <h2 className="text-sm font-semibold text-foreground">Messages</h2>
            </div>
            <Badge variant="secondary">+18% this week</Badge>
          </div>
          <MiniBarChart data={weekly} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-success/10 text-success">
                <IndianRupee className="size-4" />
              </span>
              <h2 className="text-sm font-semibold text-foreground">Sales</h2>
            </div>
            <Badge variant="secondary">₹81,880 this week</Badge>
          </div>
          <MiniBarChart data={salesWeekly} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
            <p className="mt-2 text-lg font-semibold text-foreground">412</p>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="flex size-8 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
              <ShoppingBag className="size-4" />
            </span>
            <p className="mt-2 text-lg font-semibold text-foreground">156</p>
            <p className="text-xs text-muted-foreground">Orders this month</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Megaphone className="size-4" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">Campaign Performance</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted p-2">
              <p className="text-sm font-semibold text-foreground">198</p>
              <p className="text-[10px] text-muted-foreground">Sent</p>
            </div>
            <div className="rounded-xl bg-muted p-2">
              <p className="text-sm font-semibold text-foreground">188</p>
              <p className="text-[10px] text-muted-foreground">Delivered</p>
            </div>
            <div className="rounded-xl bg-muted p-2">
              <p className="text-sm font-semibold text-foreground">119</p>
              <p className="text-[10px] text-muted-foreground">Read</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
