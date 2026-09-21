"use client"

import { useState } from "react"
import { toast } from "sonner"
import { UserPlus, MoreVertical, MessageCircle } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { InitialsAvatar } from "@/components/initials-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { team as initialTeam } from "@/lib/mock-data"

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState("")

  return (
    <div className="flex flex-col">
      <ScreenHeader
        title="Team"
        backHref="/more"
        actions={
          <Button size="icon" onClick={() => setInviteOpen(true)}>
            <UserPlus />
            <span className="sr-only">Invite Member</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-2.5 px-4 py-4">
        {initialTeam.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <div className="relative">
              <InitialsAvatar name={member.name} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${
                  member.status === "online" ? "bg-success" : "bg-muted-foreground"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{member.name}</p>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline">{member.role}</Badge>
                {member.assignedChats > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="size-3" />
                    {member.assignedChats} chats
                  </span>
                ) : null}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreVertical />
                <span className="sr-only">Options</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => toast.info("Permissions editor coming soon")}>
                    Edit Permissions
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => toast.success(`Removed ${member.name}`)}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Invite Team Member</SheetTitle>
          </SheetHeader>
          <div className="px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invite-email">Email or Mobile Number</FieldLabel>
                <Input
                  id="invite-email"
                  placeholder="teammate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button
              disabled={!email.trim()}
              onClick={() => {
                toast.success("Invitation sent")
                setEmail("")
                setInviteOpen(false)
              }}
            >
              Send Invite
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
