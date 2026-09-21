import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase()
}

const palette = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-warning/20 text-warning-foreground",
  "bg-accent text-accent-foreground",
]

export function InitialsAvatar({
  name,
  imageUrl,
  className,
}: {
  name: string
  imageUrl?: string
  className?: string
}) {
  const index = name.length % palette.length
  return (
    <Avatar className={cn("size-11", className)}>
      {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
      <AvatarFallback className={cn(palette[index], "font-semibold")}>
        {getInitials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  )
}
