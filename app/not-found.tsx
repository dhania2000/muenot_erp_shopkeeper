import Link from "next/link"
import { SearchX } from "lucide-react"
import { MobileShell } from "@/components/mobile-shell"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <MobileShell>
      <div className="flex h-screen items-center justify-center px-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>Page not found</EmptyTitle>
            <EmptyDescription>
              The screen you&apos;re looking for doesn&apos;t exist or was moved.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="rounded-full" render={<Link href="/home" />}>
            Go to Home
          </Button>
        </Empty>
      </div>
    </MobileShell>
  )
}
