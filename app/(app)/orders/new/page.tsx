import { Suspense } from "react"
import { CreateOrderFlow } from "@/components/create-order-flow"

export default function NewOrderPage() {
  return (
    <Suspense>
      <CreateOrderFlow />
    </Suspense>
  )
}
