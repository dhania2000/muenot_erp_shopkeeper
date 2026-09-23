/**
 * UI-facing domain models.
 *
 * These keep the names the screens were built against; features/mappers.ts
 * adapts the API wire types in types/api.ts onto them. Ids are strings here
 * because every Expo Router param is a string — the mappers convert back to
 * the numeric ids the API expects.
 */

/** Connection states the WhatsApp screen can show, derived from the backend health payload. */
export type WhatsAppStatus =
  | "not-connected"
  | "setup-required"
  | "connecting"
  | "registration-pending"
  | "connected"
  | "messaging-ready"
  | "action-required"
  | "failed"

export type OrderStatus = "new" | "processing" | "completed" | "cancelled"
export type PaymentStatus = "pending" | "paid" | "cod"
export type DeliveryMethod = "pickup" | "delivery"

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  avatarUrl?: string
  tags: string[]
  notes?: string
  city?: string
  state?: string
  country?: string
  archived?: boolean
  /** Humanised `lastInteractionAt`; absent when the customer has never messaged. */
  lastInteraction?: string
  /**
   * Derived from that customer's orders, which costs an extra request — so it
   * is populated on the detail screen and left undefined in list rows.
   */
  orderCount?: number
  totalSpend?: number
}

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock"

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  offerPrice?: number
  stock: StockLevel
  stockQuantity?: number
  active: boolean
  currency: string
  description?: string
  /** Remote URL from the API, or a local `file:` URI chosen but not yet uploaded. */
  imageUrl?: string
}

export interface OrderItem {
  productId: string | null
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  number: string
  customerId: string | null
  customerName: string
  customerPhone?: string
  conversationId?: string | null
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  currency: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
  notes?: string
  /** Display string for the card/header; `createdAtIso` keeps the sortable value. */
  date: string
  createdAtIso: string
}

export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed"

export interface Message {
  id: string
  direction: "in" | "out"
  text: string
  time: string
  status?: MessageStatus
  mediaUrl?: string
  mediaMimeType?: string
  messageType?: string
  errorMessage?: string
}

export interface Conversation {
  id: string
  contactId: string
  customer: Customer
  lastMessage: string
  time: string
  unreadCount: number
  assignedStaff?: string
  status: "open" | "pending" | "closed"
  priority: "low" | "normal" | "high" | "urgent"
  tags: string[]
  messages: Message[]
}

/** Meta's template review states, lower-cased. `other` covers PAUSED/DISABLED etc. */
export type TemplateStatus = "approved" | "pending" | "rejected" | "other"

export interface Template {
  id: string
  name: string
  category: string
  language: string
  status: TemplateStatus
  /** The exact status string the backend returned, shown verbatim for `other`. */
  rawStatus: string
  body: string
  rejectedReason?: string
}

export type CampaignStatus = "draft" | "scheduled" | "running" | "completed" | "failed" | "other"

export interface Campaign {
  id: string
  name: string
  audience: string
  template: string
  status: CampaignStatus
  rawStatus: string
  sent: number
  delivered: number
  read: number
  failed: number
  totalRecipients: number
  scheduledFor?: string
}

export interface Automation {
  id: string
  name: string
  enabled: boolean
  triggerType: string
  actionType: string
  /** Human-readable summary of the trigger, built from backend config only. */
  description: string
  priority: number
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  /** Raw `tenantRole` from the backend, e.g. tenant_owner / tenant_admin. */
  tenantRole: string | null
  avatarUrl?: string
}

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: "message" | "order" | "payment" | "campaign" | "whatsapp" | "general"
  read: boolean
  destination?: string
}

export interface BusinessHoursDay {
  day: string
  enabled: boolean
  open: string
  close: string
}

export interface Shop {
  name: string
  owner: string
  category: string
  email?: string
  phone?: string
  address?: string
  city: string
  state: string
  pinCode?: string
  country?: string
  timezone?: string
  currency?: string
  gstin?: string
  website?: string
  businessHours: BusinessHoursDay[]
  notificationPreferences: Record<string, boolean>
  whatsappNumber: string
  whatsappStatus: WhatsAppStatus
}

export interface HomeMetrics {
  todaysMessages: number
  unreadChats: number
  todaysOrders: number
  pendingOrders: number
  todaysSales: number
  customerCount: number
}

export interface SubscriptionSummary {
  planCode: string
  status: string
  seats: number
  currency: string
  currentPeriodEnd: string | null
  trialEnd: string | null
  /** Quota key to its limit/usage, straight from the backend snapshot. */
  quotas: { key: string; limit: number | null; usage: number; remaining: number | null }[]
  featureFlags: string[]
}
