"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Languages } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge, templateStatusTone } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { templates } from "@/lib/mock-data"

type Filter = "all" | "approved" | "pending" | "rejected"

export default function TemplatesPage() {
  const [filter, setFilter] = useState<Filter>("all")
  const filtered = templates.filter((t) => filter === "all" || t.status === filter)

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Templates" backHref="/more" />

      <div className="px-4 pt-3 pb-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2.5 px-4">
          {filtered.map((template) => (
            <Link
              key={template.id}
              href={`/more/templates/${template.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5 transition-colors active:bg-muted"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{template.name}</p>
                <StatusBadge tone={templateStatusTone(template.status)} className="capitalize">
                  {template.status}
                </StatusBadge>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{template.body}</p>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="gap-1">
                  <FileText className="size-3" />
                  {template.category}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Languages className="size-3" />
                  {template.language}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No templates found</EmptyTitle>
              <EmptyDescription>Templates in this status will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}
    </div>
  )
}
