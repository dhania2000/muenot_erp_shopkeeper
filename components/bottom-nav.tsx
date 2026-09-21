"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Inbox, ShoppingBag, Users, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/more", label: "More", icon: Menu },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="w-full max-w-md border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-stretch justify-between px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                </span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
