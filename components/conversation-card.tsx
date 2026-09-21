import Link from "next/link"
import type { Conversation } from "@/lib/types"
import { InitialsAvatar } from "@/components/initials-avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ConversationCard({ conversation }: { conversation: Conversation }) {
  const unread = conversation.unreadCount > 0

  return (
    <Link
      href={`/inbox/${conversation.id}`}
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60 active:bg-muted"
    >
      <InitialsAvatar name={conversation.customer.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              unread ? "font-semibold text-foreground" : "font-medium text-foreground"
            )}
          >
            {conversation.customer.name}
          </p>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {conversation.time}
          </span>
        </div>
        <p
          className={cn(
            "mt-0.5 truncate text-sm",
            unread ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {conversation.lastMessage}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {conversation.assignedStaff ? (
            <Badge variant="outline" className="text-[10px]">
              {conversation.assignedStaff}
            </Badge>
          ) : null}
          {conversation.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      {unread ? (
        <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {conversation.unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
