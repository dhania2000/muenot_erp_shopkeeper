"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, PackagePlus, Package } from "lucide-react"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { ScreenHeader } from "@/components/screen-header"
import { ProductCard } from "@/components/product-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { products } from "@/lib/mock-data"

export default function ProductsPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    []
  )

  const filtered = products.filter((p) => {
    if (category !== "all" && p.category !== category) return false
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col">
      <ScreenHeader
        title="Products"
        backHref="/more"
        actions={
          <Button size="icon" render={<Link href="/more/products/new" />}>
            <PackagePlus />
            <span className="sr-only">Add Product</span>
          </Button>
        }
      />

      <div className="px-4 pt-3 pb-3">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="pb-3">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="mx-4 w-[calc(100%-2rem)] overflow-x-auto">
            {categories.map((c) => (
              <TabsTrigger key={c} value={c} className="capitalize">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2.5 px-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>No products found</EmptyTitle>
              <EmptyDescription>Try a different search or category.</EmptyDescription>
            </EmptyHeader>
            <Button className="rounded-full" render={<Link href="/more/products/new" />}>
              Add Product
            </Button>
          </Empty>
        </div>
      )}
    </div>
  )
}
