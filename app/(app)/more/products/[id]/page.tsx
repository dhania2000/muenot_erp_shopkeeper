import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, Tag } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { products } from "@/lib/mock-data"

const stockConfig = {
  "in-stock": { label: "In stock", tone: "success" as const },
  "low-stock": { label: "Low stock", tone: "warning" as const },
  "out-of-stock": { label: "Out of stock", tone: "danger" as const },
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = products.find((p) => p.id === id)
  if (!product) notFound()

  const stock = stockConfig[product.stock]

  return (
    <div className="flex flex-col">
      <ScreenHeader
        title="Product Details"
        backHref="/more/products"
        actions={
          <Button variant="ghost" size="icon" render={<Link href={`/more/products/${product.id}/edit`} />}>
            <Pencil />
            <span className="sr-only">Edit</span>
          </Button>
        }
      />

      <div className="relative aspect-square w-full bg-muted">
        <Image src={product.imageUrl || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
      </div>

      <div className="flex flex-col gap-3 px-4 py-5">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-semibold leading-tight text-foreground">{product.name}</h1>
          <StatusBadge tone={stock.tone} className="shrink-0">
            {stock.label}
          </StatusBadge>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            ₹{(product.offerPrice ?? product.price).toLocaleString("en-IN")}
          </span>
          {product.offerPrice ? (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Tag className="size-3.5" />
          SKU: {product.sku} · {product.category}
        </div>

        {product.description ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-1.5 text-sm font-semibold text-foreground">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
