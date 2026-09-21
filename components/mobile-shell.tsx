import { cn } from "@/lib/utils"

export function MobileShell({
  children,
  className,
  noPadding,
}: {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <div className="flex min-h-screen w-full justify-center bg-muted/40">
      <div
        className={cn(
          "relative flex min-h-screen w-full max-w-md flex-col bg-background",
          "sm:my-0 sm:shadow-2xl",
          className
        )}
      >
        <div className={cn("flex-1", !noPadding && "pb-24")}>{children}</div>
      </div>
    </div>
  )
}
