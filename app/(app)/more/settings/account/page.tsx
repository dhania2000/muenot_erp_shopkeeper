"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Mail, Phone, KeyRound, ChevronRight } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { shop } from "@/lib/mock-data"

export default function AccountSettingsPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Account" backHref="/more/settings" />

      <div className="mx-4 mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 p-3.5">
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm text-foreground">rajesh.sharma@example.com</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3.5">
          <Phone className="size-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Mobile Number</p>
            <p className="text-sm text-foreground">{shop.whatsappNumber}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 p-3.5 text-left transition-colors active:bg-muted"
        >
          <KeyRound className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm text-foreground">Change Password</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Change Password</SheetTitle>
          </SheetHeader>
          <div className="px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
                <Input id="current-password" type="password" />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                <Input id="new-password" type="password" />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button
              onClick={() => {
                setOpen(false)
                toast.success("Password updated")
              }}
            >
              Update Password
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
