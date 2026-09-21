"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ScreenHeader } from "@/components/screen-header"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const currencies = ["INR (₹) - Indian Rupee", "USD ($) - US Dollar"]
const timezones = ["Asia/Kolkata (GMT+5:30)", "Asia/Dubai (GMT+4:00)"]

export default function BusinessDetailsStep() {
  const router = useRouter()
  const [form, setForm] = useState({
    gstin: "",
    website: "",
    hours: "10:00 AM - 9:00 PM",
    currency: "INR (₹) - Indian Rupee",
    timezone: "Asia/Kolkata (GMT+5:30)",
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    router.push("/onboarding/whatsapp")
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader title="Shop Setup" backHref="/onboarding/location" />
      <OnboardingProgress step={2} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-6 pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="gstin">GSTIN</FieldLabel>
            <Input
              id="gstin"
              placeholder="22AAAAA0000A1Z5"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
            />
            <FieldDescription>Optional</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="website">Website</FieldLabel>
            <Input
              id="website"
              placeholder="www.yourshop.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <FieldDescription>Optional</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="hours">Business Hours</FieldLabel>
            <Input
              id="hours"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="currency">Currency</FieldLabel>
            <Select
              value={form.currency}
              onValueChange={(value) => setForm({ ...form, currency: value ?? form.currency })}
            >
              <SelectTrigger id="currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
            <Select
              value={form.timezone}
              onValueChange={(value) => setForm({ ...form, timezone: value ?? form.timezone })}
            >
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <div className="mt-auto pb-8 pt-8">
          <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base">
            Continue
          </Button>
        </div>
      </form>
    </div>
  )
}
