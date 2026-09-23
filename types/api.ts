/**
 * Wire types for the Muenot ERP mobile API (/api/mobile/v1).
 *
 * These mirror the backend handlers exactly, including its two naming
 * conventions: most payloads are camelCase, but `GET /conversations/{id}`
 * returns raw snake_case message rows, as does `GET /notifications`. Nothing
 * here is reshaped — the adapters in features/mappers.ts do that.
 *
 * Source of truth: muenot_erp/docs/openapi-mobile-v1.yaml plus the route
 * handlers under muenot_erp/app/api/mobile/v1.
 */

/** `{ error, code?, fields? }` — the envelope every failing endpoint returns. */
export interface ApiErrorBody {
  error: string;
  code?: string;
  field?: string;
  /** Present on 422: field name to message. */
  fields?: Record<string, string>;
}

export interface Pagination { limit: number; offset: number; total: number }
/** `/conversations` reports its page this way instead of offset/total. */
export interface CursorPagination { limit: number; returned: number; hasMore: boolean }

/* -------------------------------------------------------------- auth ---- */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds (currently 900). */
  expiresIn: number;
  sessionId: string;
  refreshExpiresAt: string;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  /** Absent from the login payload; present on /me. */
  tenantRole?: string;
}

export interface ApiTenant {
  id: number;
  name: string;
  slug: string;
  tenantType: string | null;
  status?: string;
  plan?: string | null;
}

export type LoginResponse = AuthTokens & { user: ApiUser; tenant: ApiTenant };
export type RefreshResponse = AuthTokens;

/** One row of the ERP feature catalogue as resolved for this tenant. */
export interface FeatureResolution {
  key: string;
  label: string;
  module: string;
  kind: string;
  state: string;
  available: boolean;
  reason?: string;
  quota?: string;
  limit?: number | null;
  usage?: number;
  remaining?: number | null;
  overage?: boolean;
}

export interface MeResponse {
  user: ApiUser;
  tenant: ApiTenant | null;
  entitlements: FeatureResolution[];
}

/* --------------------------------------------------------- tenant ------- */

export interface ShopkeeperProfile {
  tenantId: number;
  shopName: string;
  ownerName: string | null;
  businessCategory: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  country: string | null;
  logoUrl: string | null;
  businessHours: Record<string, unknown> | null;
  notificationPreferences: Record<string, unknown> | null;
  timezone: string | null;
  currency: string | null;
  gstin: string | null;
  website: string | null;
}

export type ShopkeeperProfilePatch = Partial<Omit<ShopkeeperProfile, 'tenantId'>>;
export interface TenantResponse { tenant: ApiTenant | null; profile: ShopkeeperProfile | null }

/* ------------------------------------------------------ dashboard ------- */

export interface DashboardConversation {
  id: number;
  contactName: string | null;
  phone: string | null;
  lastMessageAt: string | null;
  preview: string | null;
  unreadCount: number;
}

export interface DashboardOrder {
  id: number;
  orderNumber: string;
  customerName: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface ShopkeeperDashboard {
  type: 'shopkeeper';
  todayMessages: number;
  unreadConversations: number;
  todayOrders: number;
  pendingOrders: number;
  todaySales: number;
  customerCount: number;
  recentConversations: DashboardConversation[];
  recentOrders: DashboardOrder[];
  whatsapp: { connected: boolean; phoneNumber: string | null; status: string | null };
}

/**
 * Non-SHOPKEEPER tenants get the ERP personal dashboard from the same route,
 * which carries none of the shop figures.
 */
export type DashboardResponse = ShopkeeperDashboard | ({ type?: undefined } & Record<string, unknown>);

export function isShopkeeperDashboard(value: DashboardResponse | undefined): value is ShopkeeperDashboard {
  return !!value && (value as ShopkeeperDashboard).type === 'shopkeeper';
}

/* ------------------------------------------------------- whatsapp ------- */

export interface WhatsAppHealthCheck { id: string; label: string; status: string; detail?: string }

export interface WhatsAppHealth {
  connected: boolean;
  overall: 'healthy' | 'degraded' | 'down' | 'disconnected';
  messagingReady?: boolean;
  registration?: Record<string, unknown>;
  /** Sanitised integration summary, or null when no number is connected. */
  integration: Record<string, unknown> | null;
  webhookUrl: string;
  checks: WhatsAppHealthCheck[];
  phone: {
    displayPhoneNumber: string | null;
    verifiedName: string | null;
    qualityRating: string | null;
    platformType: string | null;
  } | null;
  webhook: { lastEventAt: string | null; lastErrorAt: string | null; lastError: string | null; eventsLast24h: number };
  templates: { approved: number; total: number };
  checkedAt: string;
}

/** Per-user WhatsApp permissions. The backend re-checks every one of these. */
export interface WhatsAppCaps {
  isAgent: boolean;
  canViewAll: boolean;
  canViewDepartment: boolean;
  canSend: boolean;
  canAssign: boolean;
  canReassign: boolean;
  canClose: boolean;
  canSendTemplates: boolean;
  canCreateCampaigns: boolean;
  canViewAnalytics: boolean;
  canManageContacts: boolean;
  canManageAutomation: boolean;
  canManagePlatform: boolean;
}

export interface WhatsAppResponse { health: WhatsAppHealth; caps: WhatsAppCaps; role: 'admin' | 'employee' }

export interface ShopkeeperRegistrationRequest {
  businessName: string; businessCategory: string; ownerName: string; email: string; mobile: string;
  country: string; state: string; city: string; postalCode: string; password: string;
  termsAccepted: true; privacyAccepted: true;
}
export type RegistrationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export interface ShopkeeperRegistrationResponse { applicationId: number; status: 'PENDING_APPROVAL'; registrationToken: string }
export interface RegistrationStatusResponse {
  status: RegistrationStatus; businessName: string; ownerName: string; submittedAt: string; rejectionReason: string | null;
}
export interface WhatsAppConnectionStatus {
  connected: boolean; status: 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ACTION_REQUIRED';
  displayName: string | null; phoneNumber: string | null; connectedAt: string | null;
}
export interface WhatsAppOnboardingSession { url: string; expiresAt: string }

/* -------------------------------------------------- conversations ------- */

export type ConversationStatus = 'open' | 'pending' | 'closed';
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ApiConversation {
  id: number;
  contactId: number;
  integrationId: number | null;
  phoneNumber: string;
  profileName: string | null;
  leadId: number | null;
  leadCode: string | null;
  leadName: string | null;
  status: ConversationStatus;
  priority: ConversationPriority;
  assignedAgentId: number | null;
  assignedAgentName: string | null;
  assignedTeam: string | null;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  lastCustomerMessageAt: string | null;
}

export interface ConversationsResponse { conversations: ApiConversation[]; pagination: CursorPagination }

export type ApiMessageStatus = 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

/** Raw DB row — this endpoint is one of the two that return snake_case. */
export interface ApiMessageRow {
  id: number;
  conversation_id: number;
  wamid: string | null;
  direction: 'inbound' | 'outbound';
  message_type: string;
  message_body: string | null;
  media_id: string | null;
  media_mime_type: string | null;
  media_filename: string | null;
  media_url: string | null;
  sender_phone: string | null;
  recipient_phone: string | null;
  status: ApiMessageStatus;
  status_rank: number;
  meta_timestamp: string | null;
  error_code: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetailResponse { conversation: ApiConversation; messages: ApiMessageRow[] }

export interface SendMessageInput {
  conversationId?: number;
  to?: string;
  mode?: 'text' | 'template';
  message?: string;
  templateName?: string;
  languageCode?: string;
}
export interface SendMessageResponse { ok: true; messageId: string | null; conversationId: number }

/* -------------------------------------------------------- contacts ------ */

export interface ApiContact {
  id: number;
  phone: string;
  name: string | null;
  email: string | null;
  notes: string | null;
  tags: string[];
  city: string | null;
  state: string | null;
  country: string | null;
  leadId: number | null;
  archivedAt: string | null;
  lastInteractionAt: string | null;
  createdAt: string | null;
}

export interface ContactInput {
  phone?: string;
  name?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  city?: string;
  state?: string;
  country?: string;
}

export interface ContactsResponse { contacts: ApiContact[]; pagination: Pagination }

/* -------------------------------------------------------- products ----- */

export type ApiStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type ApiProductStatus = 'active' | 'inactive';

export interface ApiProduct {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  description: string | null;
  price: number;
  offerPrice: number | null;
  currency: string;
  imageUrl: string | null;
  stockStatus: ApiStockStatus;
  stockQuantity: number | null;
  status: ApiProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  price?: number;
  offerPrice?: number;
  currency?: string;
  imageUrl?: string;
  stockStatus?: ApiStockStatus;
  stockQuantity?: number;
  status?: ApiProductStatus;
}

export interface ProductsResponse { products: ApiProduct[]; pagination: Pagination }

/* ---------------------------------------------------------- orders ----- */

export type ApiOrderStatus = 'new' | 'processing' | 'completed' | 'cancelled';
export type ApiPaymentStatus = 'pending' | 'paid' | 'cod';
export type ApiDeliveryMethod = 'shop_pickup' | 'home_delivery';

export interface ApiOrderItem {
  id: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ApiOrder {
  id: number;
  orderNumber: string;
  contactId: number | null;
  conversationId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  status: ApiOrderStatus;
  paymentStatus: ApiPaymentStatus;
  deliveryMethod: ApiDeliveryMethod;
  deliveryAddress: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  items: ApiOrderItem[];
}

export interface OrderItemInput {
  productId?: number;
  productName?: string;
  sku?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface OrderInput {
  conversationId?: number;
  contactId?: number;
  customerName?: string;
  customerPhone?: string;
  discount?: number;
  currency?: string;
  status?: ApiOrderStatus;
  paymentStatus?: ApiPaymentStatus;
  deliveryMethod?: ApiDeliveryMethod;
  deliveryAddress?: string;
  notes?: string;
  items: OrderItemInput[];
}

export interface OrderPatch {
  status?: ApiOrderStatus;
  paymentStatus?: ApiPaymentStatus;
  deliveryMethod?: ApiDeliveryMethod;
  deliveryAddress?: string;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  discount?: number;
}

export interface OrdersResponse { orders: ApiOrder[]; pagination: Pagination }

/* ------------------------------------------------------- templates ----- */

export interface ApiTemplate {
  id: number;
  name: string;
  language: string;
  category: string | null;
  /** Meta's own status, upper-case: APPROVED | PENDING | REJECTED | ... */
  status: string;
  headerType: string | null;
  headerText: string | null;
  bodyText: string | null;
  footerText: string | null;
  buttons: { type?: string; text?: string; url?: string; phone_number?: string }[];
  variableCount: number;
  metaId: string | null;
  qualityScore: string | null;
  rejectedReason: string | null;
  previousStatus: string | null;
  statusChangedAt: string | null;
  version: number;
}
export interface TemplatesResponse { templates: ApiTemplate[] }

/* ------------------------------------------------------- campaigns ----- */

export interface ApiCampaign {
  id: number;
  name: string;
  type: string;
  audienceId: number | null;
  audienceName: string | null;
  templateName: string | null;
  templateLanguage: string | null;
  scheduledAt: string | null;
  timezone: string | null;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  repliedCount: number;
  createdBy: number | null;
  createdByName: string | null;
  launchedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
  createdAt: string;
}
export interface CampaignsResponse { campaigns: ApiCampaign[] }

/* ------------------------------------------------------ automations ---- */

export interface ApiAutomation {
  id: number;
  name: string;
  isActive: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  departmentId: number | null;
  departmentName: string | null;
  priority: number;
  runCount?: number;
  lastRunAt?: string | null;
}
export interface AutomationsResponse { automations: ApiAutomation[] }

/* ------------------------------------------------------------ team ----- */

export interface ApiTeamMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  tenantRole: string | null;
}
export interface TeamResponse { team: ApiTeamMember[] }

/* --------------------------------------------------- notifications ----- */

/** Raw notification row — snake_case, like the message rows. */
export interface ApiNotification {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  module_key: string | null;
  action: string | null;
  actor_name: string | null;
  is_read: 0 | 1;
  created_at: string;
}
export interface NotificationsResponse {
  notifications: ApiNotification[];
  unread: number;
  pagination: { limit: number };
}

/* ---------------------------------------------------- subscription ----- */

export interface ApiSubscription {
  id: number;
  tenant_id: number;
  plan_code: string;
  status: string;
  seats: number;
  mrr: number;
  currency: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  updated_at: string;
}

export interface PlanEntitlements {
  modules: string[];
  users: number | null;
  employees: number | null;
  storage_gb: number | null;
  api_calls_per_month: number | null;
  automations: number | null;
  jobs: number | null;
  ai_credits_per_month: number | null;
  integrations: number | null;
  reports: string;
  support_level: string;
  /** Where the `shopkeeper.*` gates live. This is the entitlement source. */
  feature_flags: string[];
}

export interface LimitCheck { allowed: boolean; limit: number | null; usage: number; remaining: number | null }

export interface SubscriptionResponse {
  subscription: ApiSubscription | null;
  entitlements: PlanEntitlements;
  usage: Record<string, number>;
  quotas: Record<string, LimitCheck>;
}
