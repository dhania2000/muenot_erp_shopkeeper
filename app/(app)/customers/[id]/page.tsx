import Link from "next/link"
import { notFound } from "next/navigation"
import { Mail, Phone, MessageCircle, ShoppingBag, Pencil, StickyNote } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { InitialsAvatar } from "@/components/initials-avatar"
import { OrderCard } from "@/components/order-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { customers, conversations, orders } from "@/lib/mock-data"

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = customers.find((c) => c.id === id)
  if (!customer) notFound()

  const conversation = conversations.find((c) => c.customer.id === id)
  const customerOrders = orders.filter((o) => o.customerId === id)

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Customer Details" backHref="/customers" />

      <div className="flex flex-col items-center gap-3 px-4 pt-6 pb-4 text-center">
        <InitialsAvatar name={customer.name} className="size-16 text-lg" />
        <div>
          <h1 className="text-lg font-semibold text-foreground">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
        </div>
        {customer.tags.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5">
            {customer.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <Button
          variant="outline"
          className="h-16 flex-col gap-1 rounded-2xl"
          render={conversation ? <Link href={`/inbox/${conversation.id}`} /> : undefined}
          disabled={!conversation}
        >
          <MessageCircle className="size-4" />
          <span className="text-xs">Message</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col gap-1 rounded-2xl"
          render={<Link href={`/orders/new?customer=${customer.id}`} />}
        >
          <ShoppingBag className="size-4" />
          <span className="text-xs">Create Order</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col gap-1 rounded-2xl"
          render={<Link href={`/customers/${customer.id}/edit`} />}
        >
          <Pencil className="size-4" />
          <span className="text-xs">Edit</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          <Phone className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">{customer.phone}</span>
        </div>
        {customer.email ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-foreground">{customer.email}</span>
          </div>
        ) : null}
        {customer.notes ? (
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-foreground">{customer.notes}</span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-5">
        <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
          <p className="text-lg font-semibold text-foreground">{customer.orderCount}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
          <p className="text-lg font-semibold text-foreground">
            ₹{customer.totalSpend.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-muted-foreground">Total Spend</p>
        </div>
      </div>

      <div className="px-4 pb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Orders</h2>
        {customerOrders.length > 0 ? (
          <div className="flex flex-col gap-2">
            {customerOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <Empty className="border border-dashed">
            <EmptyMedia variant="icon">
              <ShoppingBag />
            </EmptyMedia>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>Orders from this customer will appear here.</EmptyDescription>
          </Empty>
        )}
      </div>
    </div>
  )
}
