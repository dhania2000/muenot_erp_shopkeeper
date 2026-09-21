"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X, Plus } from "lucide-react"
import type { Customer } from "@/lib/types"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter()
  const isEdit = Boolean(customer)
  const [name, setName] = useState(customer?.name ?? "")
  const [phone, setPhone] = useState(customer?.phone ?? "")
  const [email, setEmail] = useState(customer?.email ?? "")
  const [notes, setNotes] = useState(customer?.notes ?? "")
  const [tags, setTags] = useState<string[]>(customer?.tags ?? [])
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)

  const isValid = name.trim().length > 1 && phone.trim().length >= 10

  function addTag() {
    const value = tagInput.trim()
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value])
    }
    setTagInput("")
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success(isEdit ? "Customer updated" : "Customer added")
      router.push(isEdit ? `/customers/${customer!.id}` : "/customers")
    }, 700)
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader
        title={isEdit ? "Edit Customer" : "Add Customer"}
        backHref={isEdit ? `/customers/${customer!.id}` : "/customers"}
      />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-4 pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="tags">Tags</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="tags"
                placeholder="e.g. VIP, Wholesale"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="button" size="icon-xs" onClick={addTag} aria-label="Add tag">
                  <Plus />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      className="rounded-full p-0.5 hover:bg-secondary-foreground/10"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Textarea
              id="notes"
              placeholder="Add any notes about this customer"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <div className="mt-auto flex flex-col gap-3 py-8">
          <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={!isValid || saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Customer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
