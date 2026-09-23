import type {
  ApiAutomation,
  ApiCampaign,
  ApiContact,
  ApiConversation,
  ApiMessageRow,
  ApiNotification,
  ApiOrder,
  ApiProduct,
  ApiTeamMember,
  ApiTemplate,
  ApiTenant,
  ShopkeeperProfile,
  SubscriptionResponse,
  WhatsAppHealth,
} from '@/types/api';
import { notificationCenterDestination } from '../services/notification-routing.ts';
import type {
  Automation,
  BusinessHoursDay,
  Campaign,
  CampaignStatus,
  Conversation,
  Customer,
  DeliveryMethod,
  Message,
  NotificationItem,
  Order,
  OrderItem,
  Product,
  Shop,
  StockLevel,
  SubscriptionSummary,
  TeamMember,
  Template,
  TemplateStatus,
  WhatsAppStatus,
} from '@/types/domain';

/**
 * Wire shape to UI shape. Every adapter is total: the API marks most fields
 * nullable, and a shop with an empty catalogue must still render.
 *
 * Nothing here invents a value the backend did not send. Where a field has no
 * API counterpart (a customer's order count in a list row, say) the result is
 * left undefined and the UI omits it.
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/* ------------------------------------------------------------- time ----- */

/** MySQL DATETIME ("2026-09-22 14:05:00") is not ISO; Safari/Hermes need the T. */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalised = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value) ? value.replace(' ', 'T') : value;
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

const timeOf = (date: Date) => date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today, 3:40 PM" / "Yesterday" / "12 Sep" — the format the cards were designed for. */
export function humanDate(value: string | null | undefined, now = new Date()): string {
  const date = parseApiDate(value);
  if (!date) return '';
  if (sameDay(date, now)) return `Today, ${timeOf(date)}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Compact form for list rows: "3:40 PM" today, otherwise a short date. */
export function humanShortTime(value: string | null | undefined, now = new Date()): string {
  const date = parseApiDate(value);
  if (!date) return '';
  if (sameDay(date, now)) return timeOf(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function isToday(value: string | null | undefined, now = new Date()): boolean {
  const date = parseApiDate(value);
  return !!date && sameDay(date, now);
}

/* --------------------------------------------------------- customers ---- */

export function toCustomer(contact: ApiContact): Customer {
  return {
    id: String(contact.id),
    // A WhatsApp contact may have no profile name; the number is the identity.
    name: contact.name?.trim() || contact.phone,
    phone: contact.phone,
    email: contact.email ?? undefined,
    tags: Array.isArray(contact.tags) ? contact.tags : [],
    notes: contact.notes ?? undefined,
    city: contact.city ?? undefined,
    state: contact.state ?? undefined,
    country: contact.country ?? undefined,
    archived: !!contact.archivedAt,
    lastInteraction: contact.lastInteractionAt ? humanShortTime(contact.lastInteractionAt) : undefined,
  };
}

/** Adds the figures that can only be computed from that customer's orders. */
export function withOrderTotals(customer: Customer, orders: Order[]): Customer {
  return {
    ...customer,
    orderCount: orders.length,
    totalSpend: orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
  };
}

/* ---------------------------------------------------------- products ---- */

const STOCK: Record<string, StockLevel> = {
  in_stock: 'in-stock',
  low_stock: 'low-stock',
  out_of_stock: 'out-of-stock',
};

export function toProduct(product: ApiProduct): Product {
  return {
    id: String(product.id),
    name: product.name,
    sku: product.sku ?? '',
    category: product.category ?? '',
    price: Number(product.price) || 0,
    offerPrice: product.offerPrice === null ? undefined : Number(product.offerPrice),
    stock: STOCK[product.stockStatus] ?? 'in-stock',
    stockQuantity: product.stockQuantity ?? undefined,
    active: product.status === 'active',
    currency: product.currency || 'INR',
    description: product.description ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
  };
}

export const toApiStockStatus = (stock: StockLevel) =>
  (({ 'in-stock': 'in_stock', 'low-stock': 'low_stock', 'out-of-stock': 'out_of_stock' } as const)[stock]);

/* ------------------------------------------------------------ orders ---- */

const DELIVERY_IN: Record<string, DeliveryMethod> = { shop_pickup: 'pickup', home_delivery: 'delivery' };
export const toApiDeliveryMethod = (method: DeliveryMethod) =>
  method === 'delivery' ? ('home_delivery' as const) : ('shop_pickup' as const);

export function toOrder(order: ApiOrder): Order {
  const items: OrderItem[] = (order.items ?? []).map((item) => ({
    productId: item.productId === null ? null : String(item.productId),
    name: item.productName,
    quantity: Number(item.quantity) || 0,
    price: Number(item.unitPrice) || 0,
  }));
  return {
    id: String(order.id),
    number: order.orderNumber,
    customerId: order.contactId === null ? null : String(order.contactId),
    customerName: order.customerName?.trim() || order.customerPhone || 'Walk-in customer',
    customerPhone: order.customerPhone ?? undefined,
    conversationId: order.conversationId === null ? null : String(order.conversationId),
    items,
    subtotal: Number(order.subtotal) || 0,
    discount: Number(order.discount) || 0,
    total: Number(order.total) || 0,
    currency: order.currency || 'INR',
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryMethod: DELIVERY_IN[order.deliveryMethod] ?? 'pickup',
    deliveryAddress: order.deliveryAddress ?? undefined,
    notes: order.notes ?? undefined,
    date: humanDate(order.createdAt),
    createdAtIso: order.createdAt,
  };
}

/* ----------------------------------------------------- conversations ---- */

/** The inbox row carries enough contact detail to render without a second call. */
export function conversationCustomer(conversation: ApiConversation): Customer {
  return {
    id: String(conversation.contactId),
    name: conversation.profileName?.trim() || conversation.leadName?.trim() || conversation.phoneNumber,
    phone: conversation.phoneNumber,
    tags: [],
  };
}

export function toConversation(conversation: ApiConversation, messages: ApiMessageRow[] = []): Conversation {
  const tags: string[] = [];
  if (conversation.assignedTeam) tags.push(conversation.assignedTeam);
  if (conversation.priority && conversation.priority !== 'normal') tags.push(conversation.priority);

  return {
    id: String(conversation.id),
    contactId: String(conversation.contactId),
    customer: conversationCustomer(conversation),
    lastMessage: conversation.lastMessagePreview ?? '',
    time: humanShortTime(conversation.lastMessageAt),
    unreadCount: Number(conversation.unreadCount) || 0,
    assignedStaff: conversation.assignedAgentName ?? undefined,
    status: conversation.status,
    priority: conversation.priority,
    tags,
    messages: messages.map(toMessage),
  };
}

/** `received` is inbound-only and has no tick, so it maps to no status at all. */
const MESSAGE_STATUS = { queued: 'queued', sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' } as const;

export function toMessage(row: ApiMessageRow): Message {
  const body = row.message_body ?? '';
  return {
    id: String(row.id),
    direction: row.direction === 'outbound' ? 'out' : 'in',
    // A media message can arrive with an empty body; name the type instead of
    // rendering a blank bubble.
    text: body || (row.media_url || row.media_id ? `[${row.message_type || 'media'}]` : ''),
    time: humanShortTime(row.created_at),
    status: row.direction === 'outbound' ? MESSAGE_STATUS[row.status as keyof typeof MESSAGE_STATUS] : undefined,
    mediaUrl: row.media_url ?? undefined,
    mediaMimeType: row.media_mime_type ?? undefined,
    messageType: row.message_type,
    errorMessage: row.error_message ?? undefined,
  };
}

/* --------------------------------------------------------- templates ---- */

const TEMPLATE_STATUS: Record<string, TemplateStatus> = {
  APPROVED: 'approved',
  PENDING: 'pending',
  IN_APPEAL: 'pending',
  PENDING_DELETION: 'pending',
  REJECTED: 'rejected',
  DISABLED: 'rejected',
};

export function toTemplate(template: ApiTemplate): Template {
  const raw = String(template.status ?? '').toUpperCase();
  return {
    id: String(template.id),
    name: template.name,
    category: template.category ?? '',
    language: template.language,
    // Anything Meta reports that is not one of the known states is shown as-is
    // rather than being forced into an approval bucket it does not belong in.
    status: TEMPLATE_STATUS[raw] ?? 'other',
    rawStatus: raw.toLowerCase().replace(/_/g, ' '),
    body: template.bodyText ?? '',
    rejectedReason: template.rejectedReason ?? undefined,
  };
}

/* --------------------------------------------------------- campaigns ---- */

const CAMPAIGN_STATUS: Record<string, CampaignStatus> = {
  draft: 'draft',
  scheduled: 'scheduled',
  queued: 'scheduled',
  running: 'running',
  sending: 'running',
  completed: 'completed',
  sent: 'completed',
  failed: 'failed',
  cancelled: 'failed',
};

export function toCampaign(campaign: ApiCampaign): Campaign {
  const raw = String(campaign.status ?? '').toLowerCase();
  return {
    id: String(campaign.id),
    name: campaign.name,
    audience: campaign.audienceName ?? (campaign.totalRecipients ? `${campaign.totalRecipients} recipients` : 'No audience'),
    template: campaign.templateName ?? '',
    status: CAMPAIGN_STATUS[raw] ?? 'other',
    rawStatus: raw.replace(/_/g, ' '),
    sent: Number(campaign.sentCount) || 0,
    delivered: Number(campaign.deliveredCount) || 0,
    read: Number(campaign.readCount) || 0,
    failed: Number(campaign.failedCount) || 0,
    totalRecipients: Number(campaign.totalRecipients) || 0,
    scheduledFor: campaign.scheduledAt ? humanDate(campaign.scheduledAt) : undefined,
  };
}

/* -------------------------------------------------------- automations --- */

const humanise = (value: string) => value.replace(/[_.]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function toAutomation(automation: ApiAutomation): Automation {
  return {
    id: String(automation.id),
    name: automation.name,
    enabled: !!automation.isActive,
    triggerType: automation.triggerType,
    actionType: automation.actionType,
    // Built only from what the backend sent — no invented trigger copy.
    description: `When ${humanise(automation.triggerType)} then ${humanise(automation.actionType)}`,
    priority: Number(automation.priority) || 0,
  };
}

/* -------------------------------------------------------------- team ---- */

export function toTeamMember(member: ApiTeamMember): TeamMember {
  return {
    id: String(member.id),
    name: member.name,
    email: member.email,
    role: member.tenantRole ? humanise(member.tenantRole) : member.role === 'admin' ? 'Admin' : 'Staff',
    tenantRole: member.tenantRole,
  };
}

/* ----------------------------------------------------- notifications ---- */

const NOTIFICATION_TYPE: Record<string, NotificationItem['type']> = {
  whatsapp: 'message',
  inbox: 'message',
  messages: 'message',
  orders: 'order',
  shopkeeper_orders: 'order',
  finance: 'payment',
  billing: 'payment',
  campaigns: 'campaign',
  marketing: 'campaign',
};

export function toNotification(row: ApiNotification): NotificationItem {
  const moduleKey = String(row.module_key ?? '').toLowerCase();
  return {
    id: String(row.id),
    title: row.title,
    description: row.body ?? '',
    time: humanShortTime(row.created_at),
    type: NOTIFICATION_TYPE[moduleKey] ?? 'general',
    read: row.is_read === 1,
    destination: notificationCenterDestination(row.link) ?? undefined,
  };
}

/* -------------------------------------------------------- whatsapp ------ */

/**
 * Collapses the backend health payload onto the states the WhatsApp screen
 * renders. Only signals the backend actually sends are consulted.
 */
export function toWhatsAppStatus(health: WhatsAppHealth | null | undefined): WhatsAppStatus {
  if (!health) return 'not-connected';
  if (!health.integration && !health.connected) {
    return health.overall === 'disconnected' ? 'not-connected' : 'setup-required';
  }
  if (health.registration && !health.connected) return 'registration-pending';
  if (health.overall === 'down') return 'failed';
  if (health.overall === 'degraded') return 'action-required';
  if (health.connected && health.messagingReady) return 'messaging-ready';
  if (health.connected) return 'connected';
  return 'connecting';
}

/**
 * The dashboard carries a much thinner WhatsApp block than /whatsapp does —
 * presence of a phone number id is the whole signal — so it gets its own
 * reading rather than being forced through the health mapper.
 */
export function dashboardWhatsAppStatus(
  whatsapp: { connected: boolean; phoneNumber: string | null; status: string | null } | null | undefined,
  fallback: WhatsAppStatus,
): WhatsAppStatus {
  if (!whatsapp) return fallback;
  if (!whatsapp.connected) return whatsapp.phoneNumber ? 'setup-required' : 'not-connected';
  return 'connected';
}

export const WHATSAPP_STATUS_LABEL: Record<WhatsAppStatus, string> = {
  'not-connected': 'Not connected',
  'setup-required': 'Setup required',
  connecting: 'Connecting',
  'registration-pending': 'Registration pending',
  connected: 'Connected',
  'messaging-ready': 'Messaging ready',
  'action-required': 'Action required',
  failed: 'Failed',
};

export function whatsAppTone(status: WhatsAppStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'messaging-ready' || status === 'connected') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'connecting' || status === 'registration-pending') return 'info';
  return 'warning';
}

/* ------------------------------------------------------------- shop ----- */

function toBusinessHours(raw: Record<string, unknown> | null | undefined): BusinessHoursDay[] {
  return DAYS.map((day) => {
    const entry = raw?.[day] ?? raw?.[day.toLowerCase()];
    if (entry && typeof entry === 'object') {
      const value = entry as Record<string, unknown>;
      return {
        day,
        enabled: value.enabled !== false && value.closed !== true,
        open: typeof value.open === 'string' ? value.open : '',
        close: typeof value.close === 'string' ? value.close : '',
      };
    }
    // No stored hours for this day: shown as unset rather than as a made-up
    // 10-to-9 default.
    return { day, enabled: false, open: '', close: '' };
  });
}

function toNotificationPreferences(raw: Record<string, unknown> | null | undefined): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(raw ?? {})) result[key] = value === true;
  return result;
}

export function toShop(
  tenant: ApiTenant | null,
  profile: ShopkeeperProfile | null,
  whatsapp?: { phoneNumber: string | null; status: WhatsAppStatus },
): Shop {
  return {
    name: profile?.shopName || tenant?.name || 'Your shop',
    owner: profile?.ownerName ?? '',
    category: profile?.businessCategory ?? '',
    email: profile?.email ?? undefined,
    phone: profile?.phone ?? undefined,
    address: profile?.address ?? undefined,
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    pinCode: profile?.pinCode ?? undefined,
    country: profile?.country ?? undefined,
    timezone: profile?.timezone ?? undefined,
    currency: profile?.currency ?? undefined,
    gstin: profile?.gstin ?? undefined,
    website: profile?.website ?? undefined,
    businessHours: toBusinessHours(profile?.businessHours),
    notificationPreferences: toNotificationPreferences(profile?.notificationPreferences),
    whatsappNumber: whatsapp?.phoneNumber ?? profile?.phone ?? '',
    whatsappStatus: whatsapp?.status ?? 'not-connected',
  };
}

export function businessHoursToApi(hours: BusinessHoursDay[]): Record<string, unknown> {
  return Object.fromEntries(hours.map((h) => [h.day, { enabled: h.enabled, open: h.open, close: h.close }]));
}

/* ----------------------------------------------------- subscription ----- */

export function toSubscriptionSummary(response: SubscriptionResponse): SubscriptionSummary {
  const sub = response.subscription;
  return {
    planCode: sub?.plan_code ?? 'starter',
    status: sub?.status ?? 'unknown',
    seats: Number(sub?.seats) || 0,
    currency: sub?.currency ?? 'INR',
    currentPeriodEnd: sub?.current_period_end ?? null,
    trialEnd: sub?.trial_end ?? null,
    quotas: Object.entries(response.quotas ?? {}).map(([key, check]) => ({
      key,
      limit: check.limit,
      usage: check.usage,
      remaining: check.remaining,
    })),
    featureFlags: response.entitlements?.feature_flags ?? [],
  };
}
