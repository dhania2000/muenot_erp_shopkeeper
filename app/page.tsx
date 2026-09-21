"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MobileShell } from "@/components/mobile-shell"
import { Spinner } from "@/components/ui/spinner"

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/welcome"), 1800)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <MobileShell noPadding>
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-primary px-8 text-primary-foreground">
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/20">
            <Image
              src="/images/logo-mark.png"
              alt="Muenot"
              width={56}
              height={56}
              className="rounded-2xl"
              priority
            />
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold tracking-tight">Muenot</p>
            <p className="text-sm text-primary-foreground/80">Shopkeeper</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 pb-12">
          <Spinner className="text-primary-foreground" />
          <p className="text-xs text-primary-foreground/70">Setting things up...</p>
        </div>
      </div>
    </MobileShell>
  )
}
