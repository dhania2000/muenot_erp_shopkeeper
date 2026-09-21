"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ScreenHeader } from "@/components/screen-header"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories = [
  "Kirana Store",
  "Garment Shop",
  "Jewellery Shop",
  "Mobile Shop",
  "Electronics Shop",
  "Hardware Store",
  "Other Retail",
]

export default function ShopDetailsStep() {
  const router = useRouter()
  const [form, setForm] = useState({ shopName: "", ownerName: "", category: "" })

  const isValid = form.shopName.trim().length > 1 && form.category.length > 0

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    router.push("/onboarding/location")
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader title="Shop Setup" backHref="/signup" />
      <OnboardingProgress step={0} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-6 pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="shop-name">Shop Name</FieldLabel>
            <Input
              id="shop-name"
              placeholder="Sharma General Store"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="owner-name">Owner Name</FieldLabel>
            <Input
              id="owner-name"
              placeholder="Rajesh Sharma"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="category">Business Category</FieldLabel>
            <Select
              value={form.category}
              onValueChange={(value) => setForm({ ...form, category: value })}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
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
