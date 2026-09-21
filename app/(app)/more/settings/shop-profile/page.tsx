"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { shop } from "@/lib/mock-data"

export default function ShopProfileSettingsPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: shop.name,
    owner: shop.owner,
    category: shop.category,
    address: "Shop no. 12, Main Market Road",
    city: shop.city,
    state: shop.state,
  })
  const [saving, setSaving] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success("Shop profile updated")
      router.push("/more/settings")
    }, 700)
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader title="Shop Profile" backHref="/more/settings" />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-4 pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="shop-name">Shop Name</FieldLabel>
            <Input id="shop-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="owner">Owner Name</FieldLabel>
            <Input id="owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="category">Business Category</FieldLabel>
            <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Textarea
              id="address"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="state">State</FieldLabel>
              <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
          </div>
        </FieldGroup>
        <div className="mt-auto flex flex-col gap-3 py-8">
          <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
