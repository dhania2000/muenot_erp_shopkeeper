import Link from "next/link"
import type { Order } from "@/lib/types"
import {
  StatusBadge,
  orderStatusTone,
  paymentStatusTone,
} from "@/components/status-badge"

const statusLabel: Record<Order["status"], string> = {
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

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/40 active:bg-muted"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{order.number}</p>
        <StatusBadge tone={orderStatusTone(order.status)}>
          {statusLabel[order.status]}
        </StatusBadge>
      </div>
      <p className="text-sm text-muted-foreground">{order.customerName}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {order.items.length} item{order.items.length > 1 ? "s" : ""} ·{" "}
          {order.date}
        </span>
        <span className="text-sm font-semibold text-foreground">
          ₹{order.total.toLocaleString("en-IN")}
        </span>
      </div>
      <StatusBadge tone={paymentStatusTone(order.paymentStatus)} className="w-fit">
        {paymentLabel[order.paymentStatus]}
      </StatusBadge>
    </Link>
  )
}
