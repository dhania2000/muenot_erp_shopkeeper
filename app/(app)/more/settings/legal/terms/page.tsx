import { ScreenHeader } from "@/components/screen-header"

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader title="Terms of Service" backHref="/more/settings" />
      <div className="flex flex-col gap-4 px-4 py-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          By using Muenot Shopkeeper, you agree to use the app only for
          legitimate business communication with your customers.
        </p>
        <p>
          You are responsible for keeping your account credentials secure and
          for all activity that happens under your account.
        </p>
        <p>
          WhatsApp messaging campaigns must comply with WhatsApp&apos;s commerce
          and messaging policies, including obtaining consent before sending
          marketing messages.
        </p>
        <p>
          Muenot may suspend accounts that violate WhatsApp policies or use
          the platform for spam or unsolicited messaging.
        </p>
      </div>
    </div>
  )
}
