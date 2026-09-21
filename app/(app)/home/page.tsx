import Link from "next/link"
import {
  Bell,
  MessageCircle,
  ShoppingBag,
  IndianRupee,
  MessageSquarePlus,
  UserPlus,
  PackagePlus,
  ChevronRight,
} from "lucide-react"
import { InitialsAvatar } from "@/components/initials-avatar"
import { MetricCard } from "@/components/metric-card"
import { StatusBadge, whatsappStatusTone, whatsappStatusLabel } from "@/components/status-badge"
import { ConversationCard } from "@/components/conversation-card"
import { OrderCard } from "@/components/order-card"
import { Button } from "@/components/ui/button"
import { shop, homeMetrics, conversations, orders } from "@/lib/mock-data"

const quickActions = [
  { href: "/inbox", label: "Open Inbox", icon: MessageSquarePlus },
  { href: "/orders/new", label: "New Order", icon: ShoppingBag },
  { href: "/customers/new", label: "Add Customer", icon: UserPlus },
  { href: "/more/products/new", label: "Add Product", icon: PackagePlus },
]

export default function HomePage() {
  const recentMessages = conversations.slice(0, 3)
  const recentOrders = orders.slice(0, 3)

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <InitialsAvatar name={shop.name} className="size-11" />
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {shop.name}
            </p>
            <p className="text-xs text-muted-foreground">{shop.category}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="relative" render={<Link href="/notifications" />}>
          <Bell />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>
      </header>

      <div className="px-4 pb-5">
        <h1 className="text-xl font-semibold text-foreground">
          Good morning, {shop.owner.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in your shop today.
        </p>
      </div>

      <div className="px-4 pb-5">
        <Link
          href="/more/settings/whatsapp"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">WhatsApp Business</p>
              <p className="text-xs text-muted-foreground">{shop.whatsappNumber}</p>
            </div>
          </div>
          <StatusBadge tone={whatsappStatusTone(shop.whatsappStatus)}>
            {whatsappStatusLabel(shop.whatsappStatus)}
          </StatusBadge>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-5">
        <MetricCard label="Today's Messages" value={String(homeMetrics.todaysMessages)} icon={MessageCircle} tone="info" />
        <MetricCard label="Unread Chats" value={String(homeMetrics.unreadChats)} icon={MessageSquarePlus} tone="warning" />
        <MetricCard label="Today's Orders" value={String(homeMetrics.todaysOrders)} icon={ShoppingBag} tone="primary" />
        <MetricCard
          label="Today's Sales"
          value={`₹${homeMetrics.todaysSales.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="success"
        />
      </div>

      <div className="px-4 pb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition-colors active:bg-muted"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <action.icon className="size-5" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-foreground">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="pb-6">
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-sm font-semibold text-foreground">Recent Messages</h2>
          <Link href="/inbox" className="flex items-center text-xs font-medium text-primary">
            View all <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentMessages.map((conv) => (
            <ConversationCard key={conv.id} conversation={conv} />
          ))}
        </div>
      </div>

      <div className="pb-4">
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
          <Link href="/orders" className="flex items-center text-xs font-medium text-primary">
            View all <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <div className="flex flex-col gap-2 px-4">
          {recentOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  )
}
