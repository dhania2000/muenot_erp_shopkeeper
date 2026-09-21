"use client"

import { useMemo, useState } from "react"
import { Search, MessageCircleOff, SlidersHorizontal } from "lucide-react"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConversationCard } from "@/components/conversation-card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { conversations } from "@/lib/mock-data"

type Filter = "all" | "unread" | "assigned" | "unassigned"

export default function InboxPage() {
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    return conversations.filter((conv) => {
      if (filter === "unread" && conv.unreadCount === 0) return false
      if (filter === "assigned" && !conv.assignedStaff) return false
      if (filter === "unassigned" && conv.assignedStaff) return false
      if (query && !conv.customer.name.toLowerCase().includes(query.toLowerCase()))
        return false
      return true
    })
  }, [filter, query])

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
        <Button variant="ghost" size="icon">
          <SlidersHorizontal />
          <span className="sr-only">Filters</span>
        </Button>
      </header>

      <div className="px-4 pb-3">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search conversations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="px-4 pb-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
            <TabsTrigger value="assigned" className="flex-1">Assigned</TabsTrigger>
            <TabsTrigger value="unassigned" className="flex-1">Unassigned</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length > 0 ? (
        <div className="divide-y divide-border pt-1">
          {filtered.map((conv) => (
            <ConversationCard key={conv.id} conversation={conv} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircleOff />
              </EmptyMedia>
              <EmptyTitle>No conversations found</EmptyTitle>
              <EmptyDescription>
                Try a different filter or search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}
    </div>
  )
}
