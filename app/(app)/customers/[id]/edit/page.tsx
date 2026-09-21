import { notFound } from "next/navigation"
import { CustomerForm } from "@/components/customer-form"
import { customers } from "@/lib/mock-data"

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = customers.find((c) => c.id === id)
  if (!customer) notFound()

  return <CustomerForm customer={customer} />
}
