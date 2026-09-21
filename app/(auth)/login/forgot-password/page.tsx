"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { MailCheck } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 900)
  }

  if (sent) {
    return (
      <div className="flex h-screen flex-col">
        <ScreenHeader title="Check your inbox" onBack={() => router.back()} />
        <div className="flex flex-1 items-center justify-center px-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MailCheck />
              </EmptyMedia>
              <EmptyTitle>Reset link sent</EmptyTitle>
              <EmptyDescription>
                We&apos;ve sent password reset instructions to {value}.
              </EmptyDescription>
            </EmptyHeader>
            <Button className="rounded-full" onClick={() => router.push("/login")}>
              Back to Login
            </Button>
          </Empty>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader title="Forgot Password" onBack={() => router.back()} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-6 pt-6">
        <p className="mb-6 text-sm text-muted-foreground">
          Enter the email or mobile number linked to your account. We&apos;ll
          send you instructions to reset your password.
        </p>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="reset-identifier">Email or Mobile Number</FieldLabel>
            <Input
              id="reset-identifier"
              placeholder="you@shop.com or 98765 43210"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <FieldDescription>
              We&apos;ll send a reset link or OTP.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <div className="mt-auto pb-8">
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-full text-base"
            disabled={loading}
          >
            {loading ? <Spinner /> : null}
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </div>
      </form>
    </div>
  )
}
