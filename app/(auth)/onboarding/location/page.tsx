"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ScreenHeader } from "@/components/screen-header"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function LocationStep() {
  const router = useRouter()
  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "",
    pin: "",
    country: "India",
  })

  const isValid =
    form.address.trim().length > 3 &&
    form.city.trim().length > 1 &&
    form.pin.trim().length >= 6

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    router.push("/onboarding/business")
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader title="Shop Setup" backHref="/onboarding/shop-details" />
      <OnboardingProgress step={1} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-6 pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Textarea
              id="address"
              placeholder="Shop no. 12, Main Market Road"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input
              id="city"
              placeholder="Lucknow"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="state">State</FieldLabel>
            <Input
              id="state"
              placeholder="Uttar Pradesh"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="pin">PIN Code</FieldLabel>
              <Input
                id="pin"
                inputMode="numeric"
                placeholder="226001"
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <Input id="country" value={form.country} disabled />
            </Field>
          </div>
        </FieldGroup>
        <div className="mt-auto pb-8 pt-8">
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-full text-base"
            disabled={!isValid}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  )
}
