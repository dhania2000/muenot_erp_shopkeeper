"use client"

import { usePathname } from "next/navigation"
import { MobileShell } from "@/components/mobile-shell"
import { BottomNav } from "@/components/bottom-nav"

const FULL_SCREEN_PATTERNS = [
  /^\/inbox\/[^/]+$/,
  /^\/orders\/new$/,
  /^\/more\/campaigns\/new$/,
]

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullScreen = FULL_SCREEN_PATTERNS.some((pattern) => pattern.test(pathname))

  return (
    <>
      <MobileShell noPadding={fullScreen}>{children}</MobileShell>
      {fullScreen ? null : <BottomNav />}
    </>
  )
}
