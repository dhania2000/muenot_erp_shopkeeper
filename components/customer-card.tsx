import Link from "next/link"
import type { Customer } from "@/lib/types"
import { InitialsAvatar } from "@/components/initials-avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Link
      href={`/customers/${customer.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 active:bg-muted"
    >
      <InitialsAvatar name={customer.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {customer.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{customer.phone}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {customer.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          <span className="text-[11px] text-muted-foreground">
            {customer.orderCount} orders
          </span>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
