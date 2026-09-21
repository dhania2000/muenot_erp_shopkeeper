import { AppChrome } from "@/components/app-chrome"

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppChrome>{children}</AppChrome>
}
