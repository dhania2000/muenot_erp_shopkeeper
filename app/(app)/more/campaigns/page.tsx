import Link from "next/link"
import { Plus, Megaphone, Users, Send, CheckCheck, Eye } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { StatusBadge, campaignStatusTone } from "@/components/status-badge"
import { campaigns } from "@/lib/mock-data"

const statusLabel: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  running: "Running",
  completed: "Completed",
}

export default function CampaignsPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader
        title="Campaigns"
        backHref="/more"
        actions={
          <Button size="icon" render={<Link href="/more/campaigns/new" />}>
            <Plus />
            <span className="sr-only">New Campaign</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-2.5 px-4 py-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  {campaign.audience}
                </p>
              </div>
              <StatusBadge tone={campaignStatusTone(campaign.status)}>
                {statusLabel[campaign.status]}
              </StatusBadge>
            </div>

            {campaign.status === "scheduled" ? (
              <p className="text-xs text-muted-foreground">
                Scheduled for {campaign.scheduledFor}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-muted p-2">
                  <Send className="mx-auto mb-1 size-3.5 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">{campaign.sent}</p>
                  <p className="text-[10px] text-muted-foreground">Sent</p>
                </div>
                <div className="rounded-xl bg-muted p-2">
                  <CheckCheck className="mx-auto mb-1 size-3.5 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">{campaign.delivered}</p>
                  <p className="text-[10px] text-muted-foreground">Delivered</p>
                </div>
                <div className="rounded-xl bg-muted p-2">
                  <Eye className="mx-auto mb-1 size-3.5 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">{campaign.read}</p>
                  <p className="text-[10px] text-muted-foreground">Read</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mx-4 mb-5 flex items-start gap-2.5 rounded-2xl border border-border bg-muted/50 p-3.5">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Campaigns are sent only to eligible, consented recipients using
          approved WhatsApp templates.
        </p>
      </div>
    </div>
  )
}
