import { MessageCircleQuestion, Mail, Phone, ChevronRight } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    q: "How do I connect my WhatsApp number?",
    a: "Go to Settings > WhatsApp and tap Connect WhatsApp. Follow the on-screen steps to verify your business number.",
  },
  {
    q: "Why is my template pending approval?",
    a: "WhatsApp reviews all marketing templates before they can be used. Approval usually takes a few hours.",
  },
  {
    q: "Can I add more team members?",
    a: "Yes, go to More > Team and tap Invite Member. Your plan determines how many members you can add.",
  },
  {
    q: "How do I upgrade my subscription?",
    a: "Go to More > Subscription and choose a plan to upgrade.",
  },
]

export default function HelpSupportPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader title="Help & Support" backHref="/more/settings" />

      <div className="mx-4 mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        <a href="mailto:support@muenot.com" className="flex items-center gap-3 p-3.5 active:bg-muted">
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm text-foreground">Email Support</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </a>
        <a href="tel:+911234567890" className="flex items-center gap-3 p-3.5 active:bg-muted">
          <Phone className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm text-foreground">Call Support</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </a>
      </div>

      <div className="px-4 pt-6 pb-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <MessageCircleQuestion className="size-4" />
          Frequently Asked Questions
        </h2>
      </div>
      <div className="mx-4 rounded-2xl border border-border bg-card px-3.5">
        <Accordion defaultValue={[0]}>
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.q} value={index}>
              <AccordionTrigger className="text-sm">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
