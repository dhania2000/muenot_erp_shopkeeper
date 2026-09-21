"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ScreenHeader({
  title,
  backHref,
  onBack,
  actions,
  subtitle,
  sticky = true,
  className,
}: {
  title: string
  backHref?: string
  onBack?: () => void
  actions?: React.ReactNode
  subtitle?: string
  sticky?: boolean
  className?: string
}) {
  const router = useRouter()
  const showBack = Boolean(backHref || onBack)

  return (
    <header
      className={cn(
        "flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur",
        sticky && "sticky top-0 z-30",
        className
      )}
    >
      {showBack ? (
        backHref ? (
          <Button variant="ghost" size="icon" render={<Link href={backHref} />}>
            <ChevronLeft />
            <span className="sr-only">Back</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack ?? (() => router.back())}
          >
            <ChevronLeft />
            <span className="sr-only">Back</span>
          </Button>
        )
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
    </header>
  )
}
