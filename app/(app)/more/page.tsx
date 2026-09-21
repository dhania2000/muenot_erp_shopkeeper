import Link from "next/link"
import {
  Package,
  FileText,
  Megaphone,
  Workflow,
  Users2,
  BarChart3,
  CreditCard,
  Settings,
  ChevronRight,
  Bell,
} from "lucide-react"
import { InitialsAvatar } from "@/components/initials-avatar"
import { shop } from "@/lib/mock-data"

const sections = [
  {
    title: "Business",
    items: [
      { href: "/more/products", label: "Products", icon: Package },
      { href: "/more/templates", label: "Templates", icon: FileText },
      { href: "/more/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/more/automations", label: "Automations", icon: Workflow },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/more/team", label: "Team", icon: Users2 },
      { href: "/more/reports", label: "Reports", icon: BarChart3 },
      { href: "/more/subscription", label: "Subscription", icon: CreditCard },
    ],
  },
  {
    title: "Preferences",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/more/settings", label: "Settings", icon: Settings },
    ],
  },
]

export default function MorePage() {
  return (
    <div className="flex flex-col">
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-semibold text-foreground">More</h1>
      </header>

      <Link
        href="/more/settings"
        className="mx-4 mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted"
      >
        <InitialsAvatar name={shop.name} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{shop.name}</p>
          <p className="truncate text-xs text-muted-foreground">{shop.owner}</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      {sections.map((section) => (
        <div key={section.title} className="pb-5">
          <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h2>
          <div className="mx-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl active:bg-muted"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="size-4.5" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
