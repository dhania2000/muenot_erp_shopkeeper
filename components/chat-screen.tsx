"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ChevronLeft,
  Phone,
  MoreVertical,
  Paperclip,
  FileText,
  Send,
  User,
  ShoppingBag,
  UserCog,
  Tag,
} from "lucide-react"
import type { Conversation, Message } from "@/lib/types"
import { InitialsAvatar } from "@/components/initials-avatar"
import { MessageStatusIcon } from "@/components/message-status-icon"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Message as MessageRow,
  MessageContent,
} from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { team, templates } from "@/lib/mock-data"

export function ChatScreen({ conversation }: { conversation: Conversation }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(conversation.messages)
  const [draft, setDraft] = useState("")
  const [assignOpen, setAssignOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [tagValue, setTagValue] = useState("")
  const [assignedStaff, setAssignedStaff] = useState(conversation.assignedStaff ?? "")
  const [tags, setTags] = useState(conversation.tags)

  function sendMessage(text: string) {
    if (!text.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}-${Date.now()}`,
        direction: "out",
        text,
        time: "Just now",
        status: "sent",
      },
    ])
    setDraft("")
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft />
          <span className="sr-only">Back</span>
        </Button>
        <InitialsAvatar name={conversation.customer.name} className="size-9" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/customers/${conversation.customer.id}`}
            className="block truncate text-sm font-semibold text-foreground"
          >
            {conversation.customer.name}
          </Link>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Phone className="size-3" />
            {conversation.customer.phone}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
            <MoreVertical />
            <span className="sr-only">More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push(`/customers/${conversation.customer.id}`)}
              >
                <User />
                Customer Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/orders/new?customer=${conversation.customer.id}`)
                }
              >
                <ShoppingBag />
                Create Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssignOpen(true)}>
                <UserCog />
                Assign Staff
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTagOpen(true)}>
                <Tag />
                Add Tag
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {tags.length > 0 || assignedStaff ? (
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          {assignedStaff ? (
            <Badge variant="outline">Assigned: {assignedStaff}</Badge>
          ) : null}
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-4">
          <Marker variant="separator">
            <MarkerContent>Today</MarkerContent>
          </Marker>
          {messages.map((message) => {
            const isOut = message.direction === "out"
            return (
              <MessageRow key={message.id} align={isOut ? "end" : "start"}>
                <MessageContent>
                  <Bubble align={isOut ? "end" : "start"} variant={isOut ? "default" : "muted"}>
                    <BubbleContent>{message.text}</BubbleContent>
                  </Bubble>
                  <div
                    className={
                      isOut
                        ? "flex items-center justify-end gap-1 px-3 text-[11px] text-muted-foreground"
                        : "flex items-center gap-1 px-3 text-[11px] text-muted-foreground"
                    }
                  >
                    {message.time}
                    {isOut ? <MessageStatusIcon status={message.status} /> : null}
                  </div>
                </MessageContent>
              </MessageRow>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border p-3">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupButton
              type="button"
              size="icon-xs"
              onClick={() => toast.info("Attachment picker coming soon")}
              aria-label="Attach file"
            >
              <Paperclip />
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupTextarea
            placeholder="Type a message"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                sendMessage(draft)
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              onClick={() => setTemplateOpen(true)}
              aria-label="Use template"
            >
              <FileText />
            </InputGroupButton>
            <InputGroupButton
              type="button"
              size="icon-xs"
              onClick={() => sendMessage(draft)}
              aria-label="Send message"
            >
              <Send />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Assign to staff</SheetTitle>
          </SheetHeader>
          <div className="px-4">
            <RadioGroup value={assignedStaff} onValueChange={setAssignedStaff}>
              {team.map((member) => (
                <div key={member.id} className="flex items-center gap-2 py-2">
                  <RadioGroupItem value={member.name} id={member.id} />
                  <Label htmlFor={member.id} className="flex-1 font-normal">
                    {member.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({member.role})
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <SheetFooter>
            <Button
              onClick={() => {
                setAssignOpen(false)
                toast.success(`Assigned to ${assignedStaff}`)
              }}
            >
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={tagOpen} onOpenChange={setTagOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Add a tag</SheetTitle>
          </SheetHeader>
          <div className="px-4">
            <Input
              placeholder="e.g. VIP, Follow-up"
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <SheetFooter>
            <Button
              disabled={!tagValue.trim()}
              onClick={() => {
                if (tagValue.trim()) {
                  setTags((prev) => [...prev, tagValue.trim()])
                  setTagValue("")
                  setTagOpen(false)
                }
              }}
            >
              Add Tag
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={templateOpen} onOpenChange={setTemplateOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Use a template</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4 pb-2">
            {templates
              .filter((t) => t.status === "approved")
              .map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    sendMessage(template.body)
                    setTemplateOpen(false)
                  }}
                  className="rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
                >
                  <p className="text-sm font-medium text-foreground">
                    {template.name}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {template.body}
                  </p>
                </button>
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
