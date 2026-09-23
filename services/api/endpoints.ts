import { request } from './client';
import type { AppRelease } from '@/features/update-policy';
import type {
  AutomationsResponse,
  CampaignsResponse,
  ContactInput,
  ContactsResponse,
  ConversationDetailResponse,
  ConversationsResponse,
  DashboardResponse,
  LoginResponse,
  MeResponse,
  NotificationsResponse,
  OrderInput,
  OrderPatch,
  OrdersResponse,
  ProductInput,
  ProductsResponse,
  SendMessageInput,
  SendMessageResponse,
  ShopkeeperProfile,
  ShopkeeperProfilePatch,
  SubscriptionResponse,
  TeamResponse,
  TemplatesResponse,
  TenantResponse,
  ShopkeeperRegistrationRequest,
  ShopkeeperRegistrationResponse,
  RegistrationStatusResponse,
  WhatsAppConnectionStatus,
  WhatsAppOnboardingSession,
  ApiContact,
  ApiOrder,
  ApiProduct,
} from '@/types/api';

/**
 * Typed wrappers over the mobile API. This is the only module that knows a
 * URL path; screens and query hooks import from here.
 *
 * Note the tenant is never passed as a parameter anywhere below — the backend
 * derives it from the bearer token and ignores any tenant supplied by a client.
 */

type Opts = { signal?: AbortSignal };

/* ------------------------------------------------------------- auth ----- */

export const auth = {
  register: (input: ShopkeeperRegistrationRequest) =>
    request<ShopkeeperRegistrationResponse>('/auth/register', { method: 'POST', body: input, auth: false }),
  registrationStatus: (token: string) =>
    request<RegistrationStatusResponse>('/auth/registration-status', {
      auth: false, headers: { Authorization: `Registration ${token}` }, retries: 0,
    }),
  login: (input: { email: string; password: string; deviceName?: string; platform?: string }, opts: Opts = {}) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: input, auth: false, ...opts }),

  /** Best-effort: the local session is cleared whether or not this succeeds. */
  logout: (opts: Opts = {}) => request<{ ok: true }>('/auth/logout', { method: 'POST', body: {}, ...opts }),

  me: (opts: Opts = {}) => request<MeResponse>('/me', opts),

  sessions: (opts: Opts = {}) =>
    request<{ sessions: unknown[]; currentSessionId: string }>('/auth/sessions', opts),
};

/* ----------------------------------------------------------- tenant ----- */

export const tenant = {
  get: (opts: Opts = {}) => request<TenantResponse>('/tenant', opts),
  /** Tenant owner/admin only; the backend returns 403 for anyone else. */
  update: (patch: ShopkeeperProfilePatch, opts: Opts = {}) =>
    request<{ profile: ShopkeeperProfile }>('/tenant', { method: 'PATCH', body: patch, ...opts }),
};

/* -------------------------------------------------------- dashboard ----- */

export const dashboard = {
  get: (opts: Opts = {}) => request<DashboardResponse>('/dashboard', opts),
};

/* --------------------------------------------------------- whatsapp ----- */

export const whatsapp = {
  get: (opts: Opts = {}) => request<import('@/types/api').WhatsAppResponse>('/whatsapp', opts),
  status: (opts: Opts = {}) => request<WhatsAppConnectionStatus>('/whatsapp/status', opts),
  onboardingSession: () => request<WhatsAppOnboardingSession>('/whatsapp/onboarding-session', { method: 'POST', body: {} }),
};

/* ---------------------------------------------------- conversations ----- */

export const conversations = {
  list: (
    params: { search?: string; status?: 'open' | 'pending' | 'closed'; unread?: boolean; limit?: number } = {},
    opts: Opts = {},
  ) =>
    request<ConversationsResponse>('/conversations', {
      query: { search: params.search, status: params.status, unread: params.unread ? 'true' : undefined, limit: params.limit },
      ...opts,
    }),

  /** Also marks the conversation read server-side as a side effect. */
  get: (id: number, opts: Opts = {}) => request<ConversationDetailResponse>(`/conversations/${id}`, opts),
};

export const messages = {
  send: (input: SendMessageInput, opts: Opts = {}) =>
    request<SendMessageResponse>('/messages', { method: 'POST', body: input, ...opts }),
};

/* --------------------------------------------------------- contacts ----- */

export const contacts = {
  list: (
    params: { search?: string; includeArchived?: boolean; limit?: number; offset?: number } = {},
    opts: Opts = {},
  ) =>
    request<ContactsResponse>('/contacts', {
      query: {
        search: params.search,
        includeArchived: params.includeArchived ? '1' : undefined,
        limit: params.limit,
        offset: params.offset,
      },
      ...opts,
    }),

  get: (id: number, opts: Opts = {}) => request<{ contact: ApiContact }>(`/contacts/${id}`, opts),

  create: (input: ContactInput, opts: Opts = {}) =>
    request<{ contact: ApiContact }>('/contacts', { method: 'POST', body: input, ...opts }),

  update: (id: number, input: ContactInput, opts: Opts = {}) =>
    request<{ contact: ApiContact }>(`/contacts/${id}`, { method: 'PATCH', body: input, ...opts }),

  /** Archives rather than deletes: orders and conversations reference the row. */
  archive: (id: number, opts: Opts = {}) =>
    request<{ archived: true; id: number }>(`/contacts/${id}`, { method: 'DELETE', ...opts }),
};

/* --------------------------------------------------------- products ----- */

export const products = {
  list: (
    params: { search?: string; category?: string; status?: 'active' | 'inactive'; limit?: number; offset?: number } = {},
    opts: Opts = {},
  ) => request<ProductsResponse>('/products', { query: { ...params }, ...opts }),

  get: (id: number, opts: Opts = {}) => request<{ product: ApiProduct }>(`/products/${id}`, opts),

  create: (input: ProductInput, opts: Opts = {}) =>
    request<{ product: ApiProduct }>('/products', { method: 'POST', body: input, ...opts }),

  update: (id: number, input: ProductInput, opts: Opts = {}) =>
    request<{ product: ApiProduct }>(`/products/${id}`, { method: 'PATCH', body: input, ...opts }),

  remove: (id: number, opts: Opts = {}) =>
    request<{ deleted: true; id: number }>(`/products/${id}`, { method: 'DELETE', ...opts }),
};

/* ----------------------------------------------------------- orders ----- */

export const orders = {
  list: (
    params: {
      status?: 'new' | 'processing' | 'completed' | 'cancelled';
      paymentStatus?: 'pending' | 'paid' | 'cod';
      contactId?: number;
      search?: string;
      limit?: number;
      offset?: number;
    } = {},
    opts: Opts = {},
  ) => request<OrdersResponse>('/orders', { query: { ...params }, ...opts }),

  get: (id: number, opts: Opts = {}) => request<{ order: ApiOrder }>(`/orders/${id}`, opts),

  create: (input: OrderInput, opts: Opts = {}) =>
    request<{ order: ApiOrder }>('/orders', { method: 'POST', body: input, ...opts }),

  update: (id: number, patch: OrderPatch, opts: Opts = {}) =>
    request<{ order: ApiOrder }>(`/orders/${id}`, { method: 'PATCH', body: patch, ...opts }),
};

/* -------------------------------------------------- read-only modules --- */

export const templates = {
  list: (opts: Opts = {}) => request<TemplatesResponse>('/templates', opts),
};

export const campaigns = {
  list: (opts: Opts = {}) => request<CampaignsResponse>('/campaigns', opts),
};

export const automations = {
  list: (opts: Opts = {}) => request<AutomationsResponse>('/automations', opts),
};

export const team = {
  list: (opts: Opts = {}) => request<TeamResponse>('/team', opts),
};

export const subscription = {
  get: (opts: Opts = {}) => request<SubscriptionResponse>('/subscription', opts),
};

/* --------------------------------------------------------- devices ----- */

export interface DeviceRegistration {
  deviceId: string;
  pushToken: string;
  pushProvider: 'fcm';
  platform: 'android';
  appVersion: string;
  deviceName: string;
}

export const devices = {
  register: (input: DeviceRegistration, opts: Opts = {}) =>
    request<{ ok: true; deviceId: string }>('/devices', { method: 'POST', body: input, ...opts }),
  update: (input: DeviceRegistration, opts: Opts = {}) =>
    request<{ ok: true; deviceId: string }>('/devices', { method: 'PATCH', body: input, ...opts }),
  revoke: (deviceId: string, opts: Opts = {}) =>
    request<{ ok: true }>('/devices', { method: 'DELETE', body: { deviceId }, ...opts }),
};

/* ---------------------------------------------------- notifications ----- */

export const notifications = {
  list: (params: { limit?: number } = {}, opts: Opts = {}) =>
    request<NotificationsResponse>('/notifications', { query: { limit: params.limit }, ...opts }),

  /** Omit `id` to mark every unread notification read. */
  markRead: (id?: number, opts: Opts = {}) =>
    request<{ ok: true }>('/notifications', { method: 'PATCH', body: id ? { id } : {}, ...opts }),
};

/** Public ERP release metadata; no session is needed at startup. */
export const appVersion = {
  get: () => request<AppRelease>('/app-version', { auth: false, retries: 0, timeoutMs: 8_000 }),
};

export const api = {
  auth,
  tenant,
  dashboard,
  whatsapp,
  conversations,
  messages,
  contacts,
  products,
  orders,
  templates,
  campaigns,
  automations,
  team,
  subscription,
  devices,
  notifications,
  appVersion,
};
