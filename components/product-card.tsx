import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/types"
import { StatusBadge } from "@/components/status-badge"

const stockConfig = {
  "in-stock": { label: "In stock", tone: "success" as const },
  "low-stock": { label: "Low stock", tone: "warning" as const },
  "out-of-stock": { label: "Out of stock", tone: "danger" as const },
}

export function ProductCard({ product }: { product: Product }) {
  const stock = stockConfig[product.stock]

  return (
    <Link
      href={`/more/products/${product.id}`}
      className="flex gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted/40 active:bg-muted"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="line-clamp-2 text-sm font-medium text-foreground leading-tight">
            {product.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{product.sku}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-foreground">
              ₹{(product.offerPrice ?? product.price).toLocaleString("en-IN")}
            </span>
            {product.offerPrice ? (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            ) : null}
          </div>
          <StatusBadge tone={stock.tone}>{stock.label}</StatusBadge>
        </div>
      </div>
    </Link>
  )
}
