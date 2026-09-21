"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Minus, Plus, Search, Check, Store, Truck, Wallet, Banknote, CircleDollarSign } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { InitialsAvatar } from "@/components/initials-avatar"
import { cn } from "@/lib/utils"
import { customers, products } from "@/lib/mock-data"
import type { Customer, PaymentStatus, DeliveryMethod } from "@/lib/types"

const steps = ["Customer", "Products", "Payment", "Delivery", "Review"]

type CartLine = { productId: string; quantity: number; price: number }

export function CreateOrderFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillCustomer = searchParams.get("customer")

  const [step, setStep] = useState(0)
  const [customerId, setCustomerId] = useState<string | null>(prefillCustomer)
  const [customerQuery, setCustomerQuery] = useState("")
  const [productQuery, setProductQuery] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [payment, setPayment] = useState<PaymentStatus | null>(null)
  const [delivery, setDelivery] = useState<DeliveryMethod | null>(null)
  const [creating, setCreating] = useState(false)

  const customer = customers.find((c) => c.id === customerId) ?? null

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cart]
  )

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerQuery.toLowerCase())
  )
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productQuery.toLowerCase())
  )

  function updateQuantity(product: (typeof products)[number], delta: number) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id)
      if (!existing) {
        if (delta > 0) {
          return [...prev, { productId: product.id, quantity: 1, price: product.offerPrice ?? product.price }]
        }
        return prev
      }
      const nextQty = existing.quantity + delta
      if (nextQty <= 0) return prev.filter((l) => l.productId !== product.id)
      return prev.map((l) => (l.productId === product.id ? { ...l, quantity: nextQty } : l))
    })
  }

  const canContinue =
    (step === 0 && Boolean(customer)) ||
    (step === 1 && cart.length > 0) ||
    (step === 2 && Boolean(payment)) ||
    (step === 3 && Boolean(delivery)) ||
    step === 4

  function handleContinue() {
    if (step === 4) {
      setCreating(true)
      setTimeout(() => {
        setCreating(false)
        toast.success("Order created successfully")
        router.push("/orders")
      }, 900)
      return
    }
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function handleBack() {
    if (step === 0) {
      router.back()
      return
    }
    setStep((s) => s - 1)
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader title="New Order" onBack={handleBack} subtitle={`Step ${step + 1} of ${steps.length} · ${steps[step]}`} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {step === 0 ? (
          <div className="flex flex-col px-4 pt-4">
            <InputGroup className="mb-3">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search customers"
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
              />
            </InputGroup>
            <div className="flex flex-col gap-1.5">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCustomerId(c.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                    customerId === c.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <InitialsAvatar name={c.name} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  {customerId === c.id ? <Check className="size-4 text-primary" /> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col px-4 pt-4">
            <InputGroup className="mb-3">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search products"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
            </InputGroup>
            <div className="flex flex-col gap-1.5">
              {filteredProducts.map((p) => {
                const line = cart.find((l) => l.productId === p.id)
                const price = p.offerPrice ?? p.price
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">₹{price.toLocaleString("en-IN")}</p>
                    </div>
                    {line ? (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() => updateQuantity(p, -1)}
                        >
                          <Minus />
                        </Button>
                        <span className="w-4 text-center text-sm font-medium">{line.quantity}</span>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() => updateQuantity(p, 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" size="sm" variant="secondary" onClick={() => updateQuantity(p, 1)}>
                        Add
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-2.5 px-4 pt-4">
            {[
              { value: "cod" as const, label: "Cash on Delivery", icon: Banknote },
              { value: "paid" as const, label: "Already Paid", icon: Wallet },
              { value: "pending" as const, label: "Payment Pending", icon: CircleDollarSign },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPayment(option.value)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                  payment === option.value ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <option.icon className="size-5" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{option.label}</span>
                {payment === option.value ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-2.5 px-4 pt-4">
            {[
              { value: "pickup" as const, label: "Shop Pickup", icon: Store },
              { value: "delivery" as const, label: "Home Delivery", icon: Truck },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDelivery(option.value)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                  delivery === option.value ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <option.icon className="size-5" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{option.label}</span>
                {delivery === option.value ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="flex flex-col gap-4 px-4 pt-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-sm font-medium text-foreground">{customer?.name}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs text-muted-foreground">Items</p>
              <div className="flex flex-col gap-2">
                {cart.map((line) => {
                  const product = products.find((p) => p.id === line.productId)!
                  return (
                    <div key={line.productId} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        {product.name} × {line.quantity}
                      </span>
                      <span className="font-medium text-foreground">
                        ₹{(line.price * line.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-medium capitalize text-foreground">{payment}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="text-sm font-medium capitalize text-foreground">{delivery}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border bg-background px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">₹{total.toLocaleString("en-IN")}</span>
        </div>
        <Button
          size="lg"
          className="h-12 w-full rounded-full text-base"
          disabled={!canContinue || creating}
          onClick={handleContinue}
        >
          {creating ? "Creating order..." : step === 4 ? "Create Order" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
