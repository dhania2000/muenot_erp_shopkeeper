"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [touched, setTouched] = useState(false)

  const identifierInvalid = touched && identifier.trim().length === 0
  const passwordInvalid = touched && password.length === 0

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    setError("")

    if (!identifier.trim() || !password) return

    setLoading(true)
    setTimeout(() => {
      if (password.length < 4) {
        setError("Incorrect email/mobile or password. Please try again.")
        setLoading(false)
        return
      }
      setLoading(false)
      router.push("/home")
    }, 1100)
  }

  return (
    <div className="flex h-screen flex-col px-6 pt-10 pb-8">
      <div className="flex flex-col items-center gap-3 pb-8">
        <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-primary">
          <Image src="/images/logo-mark.png" alt="Muenot" width={32} height={32} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Login to manage your shop</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <FieldGroup>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Login failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={identifierInvalid || undefined}>
            <FieldLabel htmlFor="identifier">Email or Mobile Number</FieldLabel>
            <Input
              id="identifier"
              placeholder="you@shop.com or 98765 43210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              aria-invalid={identifierInvalid || undefined}
              autoComplete="username"
            />
            {identifierInvalid ? (
              <FieldDescription className="text-destructive">
                Enter your email or mobile number.
              </FieldDescription>
            ) : null}
          </Field>

          <Field data-invalid={passwordInvalid || undefined}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={passwordInvalid || undefined}
                autoComplete="current-password"
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
            {passwordInvalid ? (
              <FieldDescription className="text-destructive">
                Enter your password.
              </FieldDescription>
            ) : null}
          </Field>

          <div className="flex justify-end">
            <Link
              href="/login/forgot-password"
              className="text-xs font-medium text-primary"
            >
              Forgot Password?
            </Link>
          </div>
        </FieldGroup>

        <div className="mt-auto flex flex-col gap-4 pt-8">
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-full text-base"
            disabled={loading}
          >
            {loading ? <Spinner /> : null}
            {loading ? "Logging in..." : "Login"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary">
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
