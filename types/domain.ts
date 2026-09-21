export type WhatsAppStatus =
  | "not-connected"
  | "connecting"
  | "registration-pending"
  | "connected"
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
  lastInteraction: string
  orderCount: number
  totalSpend: number
}

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  offerPrice?: number
  stock: "in-stock" | "low-stock" | "out-of-stock"
  description?: string
  imageUrl: string
}

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  number: string
  customerId: string
  customerName: string
  items: OrderItem[]
  subtotal: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  deliveryMethod: DeliveryMethod
  date: string
}

export type MessageStatus = "sent" | "delivered" | "read" | "failed"

export interface Message {
  id: string
  direction: "in" | "out"
  text: string
  time: string
  status?: MessageStatus
}

export interface Conversation {
  id: string
  customer: Customer
  lastMessage: string
  time: string
  unreadCount: number
  assignedStaff?: string
  tags: string[]
  messages: Message[]
}

export type TemplateStatus = "approved" | "pending" | "rejected"

export interface Template {
  id: string
  name: string
  category: string
  language: string
  status: TemplateStatus
  body: string
}

export type CampaignStatus = "draft" | "scheduled" | "running" | "completed"

export interface Campaign {
  id: string
  name: string
  audience: string
  template: string
  status: CampaignStatus
  sent: number
  delivered: number
  read: number
  scheduledFor?: string
}

export interface TeamMember {
  id: string
  name: string
  role: "Owner" | "Manager" | "Staff"
  status: "online" | "offline"
  assignedChats: number
  avatarUrl?: string
}

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: "message" | "order" | "payment" | "campaign" | "whatsapp"
  read: boolean
}
