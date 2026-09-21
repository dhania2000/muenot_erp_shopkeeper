import { notFound } from "next/navigation"
import { orders, conversations } from "@/lib/mock-data"
import { OrderDetails } from "@/components/order-details"

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = orders.find((o) => o.id === id)
  if (!order) notFound()

  const conversation = conversations.find((c) => c.customer.id === order.customerId)

  return <OrderDetails order={order} conversationId={conversation?.id} />
}
