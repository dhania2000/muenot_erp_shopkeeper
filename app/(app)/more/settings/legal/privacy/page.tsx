import { ScreenHeader } from "@/components/screen-header"

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader title="Privacy Policy" backHref="/more/settings" />
      <div className="flex flex-col gap-4 px-4 py-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          Muenot Shopkeeper respects your privacy. This app only accesses the
          business data needed to help you manage your shop — customers,
          orders, products and WhatsApp conversations.
        </p>
        <p>
          Your data is securely stored and processed by Muenot ERP. We never
          sell your business or customer data to third parties.
        </p>
        <p>
          WhatsApp messaging is powered by the official WhatsApp Business
          Platform. Message content is used only to help you communicate with
          your customers and is not used for advertising.
        </p>
        <p>
          For full details on data collection, storage and your rights,
          contact our support team from the Help & Support screen.
        </p>
      </div>
    </div>
  )
}
