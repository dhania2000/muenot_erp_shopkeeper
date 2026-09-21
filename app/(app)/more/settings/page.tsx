"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Store,
  Clock,
  MessageCircle,
  Bell,
  Users2,
  CreditCard,
  UserCircle,
  HelpCircle,
  ShieldCheck,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { InitialsAvatar } from "@/components/initials-avatar"
import { StatusBadge, whatsappStatusTone, whatsappStatusLabel } from "@/components/status-badge"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { shop } from "@/lib/mock-data"

const sections = [
  {
    title: "Shop",
    items: [
      { href: "/more/settings/shop-profile", label: "Shop Profile", icon: Store },
      { href: "/more/settings/business-hours", label: "Business Hours", icon: Clock },
      { href: "/more/settings/whatsapp", label: "WhatsApp", icon: MessageCircle, badge: shop.whatsappStatus },
    ],
  },
  {
    title: "Preferences",
    items: [
      { href: "/more/settings/notifications", label: "Notifications", icon: Bell },
      { href: "/more/team", label: "Team", icon: Users2 },
      { href: "/more/subscription", label: "Subscription", icon: CreditCard },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/more/settings/account", label: "Account", icon: UserCircle },
      { href: "/more/settings/help", label: "Help & Support", icon: HelpCircle },
      { href: "/more/settings/legal/privacy", label: "Privacy", icon: ShieldCheck },
      { href: "/more/settings/legal/terms", label: "Terms", icon: FileText },
    ],
  },
]

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Settings" backHref="/more" />

      <div className="flex items-center gap-3 px-4 py-4">
        <InitialsAvatar name={shop.name} className="size-12" />
        <div>
          <p className="text-sm font-semibold text-foreground">{shop.name}</p>
          <p className="text-xs text-muted-foreground">{shop.owner}</p>
        </div>
      </div>

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
                {item.badge ? (
                  <StatusBadge tone={whatsappStatusTone(item.badge)}>
                    {whatsappStatusLabel(item.badge)}
                  </StatusBadge>
                ) : null}
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="px-4 pb-8">
        <AlertDialog>
          <AlertDialogTrigger className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm font-medium text-destructive transition-colors active:bg-destructive/10">
            <LogOut className="size-4" />
            Logout
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out of Muenot Shopkeeper?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to login again to access your shop.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.replace("/welcome")}>
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
