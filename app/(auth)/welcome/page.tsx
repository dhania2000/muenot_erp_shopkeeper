import Link from "next/link"
import Image from "next/image"
import { MessageCircle, Users, ShoppingBag, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

const points = [
  { icon: MessageCircle, label: "WhatsApp conversations" },
  { icon: Users, label: "Customers & relationships" },
  { icon: ShoppingBag, label: "Orders, start to finish" },
  { icon: Package, label: "Products & inventory" },
]

export default function WelcomePage() {
  return (
    <div className="flex h-screen flex-col px-6 pt-10 pb-8">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-primary">
          <Image src="/images/logo-mark.png" alt="Muenot" width={24} height={24} />
        </div>
        <span className="text-sm font-semibold text-foreground">Muenot Shopkeeper</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8 text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground">
          Run your business
          <br /> from your phone
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Manage WhatsApp, customers, orders, products and business
          communication — all from one simple app.
        </p>

        <div className="grid w-full grid-cols-2 gap-3">
          {points.map((point) => (
            <div
              key={point.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <point.icon className="size-5" />
              </span>
              <p className="text-xs font-medium leading-tight text-foreground">
                {point.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" className="h-12 w-full rounded-full text-base" render={<Link href="/signup" />}>
          Get Started
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12 w-full rounded-full text-base"
          render={<Link href="/login" />}
        >
          Login
        </Button>
      </div>
    </div>
  )
}
