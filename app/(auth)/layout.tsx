import { MobileShell } from "@/components/mobile-shell"

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MobileShell noPadding>{children}</MobileShell>
}
