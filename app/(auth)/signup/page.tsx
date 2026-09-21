"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const isValid =
    form.name.trim().length > 1 &&
    form.mobile.trim().length >= 10 &&
    form.password.length >= 6

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push("/onboarding/shop-details")
    }, 900)
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader title="Create Account" backHref="/welcome" />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-6 pt-6">
        <p className="mb-6 text-sm text-muted-foreground">
          Let&apos;s get your shop set up on Muenot Shopkeeper.
        </p>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="owner-name">Owner Name</FieldLabel>
            <Input
              id="owner-name"
              placeholder="Rajesh Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="mobile">Mobile Number</FieldLabel>
            <Input
              id="mobile"
              type="tel"
              placeholder="98765 43210"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              autoComplete="tel"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@shop.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="signup-password">Password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>Minimum 6 characters.</FieldDescription>
          </Field>
        </FieldGroup>

        <div className="mt-auto flex flex-col gap-4 pb-8 pt-8">
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-full text-base"
            disabled={!isValid || loading}
          >
            {loading ? <Spinner /> : null}
            {loading ? "Creating account..." : "Continue"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
