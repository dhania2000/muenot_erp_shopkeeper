import { notFound } from "next/navigation"
import { FileText, Languages, Tag } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { StatusBadge, templateStatusTone } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { templates } from "@/lib/mock-data"

export default async function TemplateDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const template = templates.find((t) => t.id === id)
  if (!template) notFound()

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Template Details" backHref="/more/templates" />

      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-semibold text-foreground">{template.name}</h1>
          <StatusBadge tone={templateStatusTone(template.status)} className="capitalize shrink-0">
            {template.status}
          </StatusBadge>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            <Tag className="size-3" />
            {template.category}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Languages className="size-3" />
            {template.language}
          </Badge>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileText className="size-3.5" />
            Message Preview
          </div>
          <div className="rounded-xl bg-muted p-3 text-sm leading-relaxed text-foreground">
            {template.body}
          </div>
        </div>

        {template.status === "rejected" ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            This template was rejected by WhatsApp. Please review the content and
            submit a new template.
          </div>
        ) : null}

        {template.status === "pending" ? (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground">
            This template is under review. Approval usually takes a few hours.
          </div>
        ) : null}
      </div>
    </div>
  )
}
