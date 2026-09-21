"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Camera } from "lucide-react"
import type { Product } from "@/lib/types"
import { ScreenHeader } from "@/components/screen-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories = ["Grocery", "Garments", "Jewellery", "Mobiles", "Electronics", "Hardware"]

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const isEdit = Boolean(product)
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "")
  const [name, setName] = useState(product?.name ?? "")
  const [sku, setSku] = useState(product?.sku ?? "")
  const [category, setCategory] = useState(product?.category ?? "")
  const [price, setPrice] = useState(product ? String(product.price) : "")
  const [offerPrice, setOfferPrice] = useState(product?.offerPrice ? String(product.offerPrice) : "")
  const [stock, setStock] = useState<Product["stock"]>(product?.stock ?? "in-stock")
  const [description, setDescription] = useState(product?.description ?? "")
  const [saving, setSaving] = useState(false)

  const isValid = name.trim().length > 1 && sku.trim().length > 0 && category.length > 0 && Number(price) > 0

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setImageUrl(URL.createObjectURL(file))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success(isEdit ? "Product updated" : "Product added")
      router.push(isEdit ? `/more/products/${product!.id}` : "/more/products")
    }, 700)
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader
        title={isEdit ? "Edit Product" : "Add Product"}
        backHref={isEdit ? `/more/products/${product!.id}` : "/more/products"}
      />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-4 pt-5">
        <div className="flex justify-center pb-5">
          <label className="relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-picked local/blob preview, not optimizable
              <img src={imageUrl} alt="Product" className="size-full object-cover" />
            ) : (
              <Camera className="size-6 text-muted-foreground" />
            )}
            <input type="file" accept="image/*" onChange={handleImagePick} className="sr-only" />
          </label>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="product-name">Product Name</FieldLabel>
            <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Basmati Rice 5kg" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="sku">SKU</FieldLabel>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="RIC-5KG-001" />
            </Field>
            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="price">Price (₹)</FieldLabel>
              <Input id="price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="650" />
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-price">Offer Price (₹)</FieldLabel>
              <Input
                id="offer-price"
                inputMode="numeric"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="599"
              />
              <FieldDescription>Optional</FieldDescription>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="stock">Stock Status</FieldLabel>
            <Select value={stock} onValueChange={(v) => setStock(v as Product["stock"])}>
              <SelectTrigger id="stock" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="in-stock">In stock</SelectItem>
                  <SelectItem value="low-stock">Low stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of stock</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this product"
            />
          </Field>
        </FieldGroup>

        <div className="mt-auto flex flex-col gap-3 py-8">
          <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base" disabled={!isValid || saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}
