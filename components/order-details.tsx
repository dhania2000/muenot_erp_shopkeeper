"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { MessageCircle, Truck, Store, CreditCard } from "lucide-react"
import type { Order, OrderStatus } from "@/lib/types"
import { ScreenHeader } from "@/components/screen-header"
import { StatusBadge, orderStatusTone, paymentStatusTone } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statusLabel: Record<OrderStatus, string> = {
  new: "New",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
}

const paymentLabel: Record<Order["paymentStatus"], string> = {
  pending: "Payment pending",
  paid: "Paid",
  cod: "Cash on delivery",
}

export function OrderDetails({
  order,
  conversationId,
}: {
  order: Order
  conversationId?: string
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status)

  return (
    <div className="flex flex-col">
      <ScreenHeader title={order.number} backHref="/orders" subtitle={order.date} />

      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-sm font-medium text-foreground">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">Order status</p>
        </div>
        <StatusBadge tone={orderStatusTone(status)}>{statusLabel[status]}</StatusBadge>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pt-4">
        {order.items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                Qty {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              ₹{(item.quantity * item.price).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 px-4 pt-4 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold text-foreground">
          <span>Total</span>
          <span>₹{order.total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pt-5">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          <CreditCard className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm text-foreground">Payment</span>
          <StatusBadge tone={paymentStatusTone(order.paymentStatus)}>
            {paymentLabel[order.paymentStatus]}
          </StatusBadge>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          {order.deliveryMethod === "delivery" ? (
            <Truck className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Store className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1 text-sm text-foreground">Delivery</span>
          <span className="text-sm text-muted-foreground">
            {order.deliveryMethod === "delivery" ? "Home Delivery" : "Shop Pickup"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 pt-6">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="status">
          Update Status
        </label>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as OrderStatus)
            toast.success(`Order marked as ${statusLabel[v as OrderStatus]}`)
          }}
        >
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="px-4 py-6">
        <Button
          variant="outline"
          className="h-12 w-full rounded-full"
          disabled={!conversationId}
          render={conversationId ? <Link href={`/inbox/${conversationId}`} /> : undefined}
        >
          <MessageCircle />
          Message Customer
        </Button>
      </div>
    </div>
  )
}
