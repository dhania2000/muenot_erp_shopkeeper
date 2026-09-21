"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, UserRoundPlus, UsersRound } from "lucide-react"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { CustomerCard } from "@/components/customer-card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { customers } from "@/lib/mock-data"

export default function CustomersPage() {
  const [query, setQuery] = useState("")

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.includes(query)
      ),
    [query]
  )

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-xl font-semibold text-foreground">Customers</h1>
        <Button size="icon" render={<Link href="/customers/new" />}>
          <UserRoundPlus />
          <span className="sr-only">Add Customer</span>
        </Button>
      </header>

      <div className="px-4 pb-3">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <p className="px-4 pb-2 text-xs text-muted-foreground">
        {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length > 0 ? (
        <div className="divide-y divide-border">
          {filtered.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersRound />
              </EmptyMedia>
              <EmptyTitle>No customers found</EmptyTitle>
              <EmptyDescription>
                Try a different search, or add a new customer.
              </EmptyDescription>
            </EmptyHeader>
            <Button className="rounded-full" render={<Link href="/customers/new" />}>
              Add Customer
            </Button>
          </Empty>
        </div>
      )}
    </div>
  )
}
