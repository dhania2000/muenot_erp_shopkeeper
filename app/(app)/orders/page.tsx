"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderCard } from "@/components/order-card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { orders } from "@/lib/mock-data"

type Filter = "all" | "new" | "processing" | "completed" | "cancelled"

export default function OrdersPage() {
  const [filter, setFilter] = useState<Filter>("all")

  const filtered = orders.filter((o) => filter === "all" || o.status === filter)

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-xl font-semibold text-foreground">Orders</h1>
        <Button size="icon" render={<Link href="/orders/new" />}>
          <Plus />
          <span className="sr-only">New Order</span>
        </Button>
      </header>

      <div className="pb-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="mx-4 w-[calc(100%-2rem)] overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2.5 px-4">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBag />
              </EmptyMedia>
              <EmptyTitle>No orders here</EmptyTitle>
              <EmptyDescription>Orders matching this filter will show up here.</EmptyDescription>
            </EmptyHeader>
            <Button className="rounded-full" render={<Link href="/orders/new" />}>
              Create Order
            </Button>
          </Empty>
        </div>
      )}
    </div>
  )
}
