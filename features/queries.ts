import { useEffect, useMemo } from 'react';
import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,

} from '@tanstack/react-query';
import { api } from '@/services/api/endpoints';
import { ApiError, isApiError } from '@/services/api/errors';
import { setBackendUnreadBadge } from '@/services/notifications';
import { useSession, type ShopkeeperFeature } from './session';
import {
  toAutomation,
  toCampaign,
  toConversation,
  toCustomer,
  toNotification,
  toOrder,
  toProduct,
  toShop,
  toSubscriptionSummary,
  toTeamMember,
  toTemplate,
  toWhatsAppStatus,
  withOrderTotals,
} from './mappers';
import type {
  ContactInput,
  OrderInput,
  OrderPatch,
  ProductInput,
  SendMessageInput,
  ShopkeeperProfilePatch,
} from '@/types/api';
import { isShopkeeperDashboard } from '@/types/api';
import type { Conversation, Customer, HomeMetrics, Order, Product } from '@/types/domain';

const PAGE_SIZE = 50;

/* -------------------------------------------------------- query keys ---- */

export const queryKeys = {
  me: ['me'] as const,
  tenant: ['tenant'] as const,
  dashboard: ['dashboard'] as const,
  whatsapp: ['whatsapp'] as const,
  subscription: ['subscription'] as const,
  conversations: (params?: object) => ['conversations', params ?? {}] as const,
  conversation: (id: string) => ['conversation', id] as const,
  contacts: (params?: object) => ['contacts', params ?? {}] as const,
  contact: (id: string) => ['contact', id] as const,
  products: (params?: object) => ['products', params ?? {}] as const,
  product: (id: string) => ['product', id] as const,
  orders: (params?: object) => ['orders', params ?? {}] as const,
  order: (id: string) => ['order', id] as const,
  templates: ['templates'] as const,
  campaigns: ['campaigns'] as const,
  automations: ['automations'] as const,
  team: ['team'] as const,
  notifications: ['notifications'] as const,
};

/* ------------------------------------------------------ query client ---- */

/**
 * An expired session or a plan refusal is never worth retrying — the same
 * request will fail identically. Everything else gets two more attempts, which
 * the API client itself already applies to GETs; this covers the rest.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) {
    if (!error.isRetryable) return false;
    if (error.kind === 'rateLimited') return false;
  }
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

/**
 * Records a plan refusal on the session store so the matching navigation entry
 * disappears, then re-throws for the caller's own error handling.
 */
function watchEntitlement<T>(feature: ShopkeeperFeature, run: () => Promise<T>): Promise<T> {
  return run().catch((error) => {
    if (isApiError(error) && error.isNotEntitled) useSession.getState().noteFeatureDenied(feature);
    throw error;
  });
}

/** Only query once the user is actually signed in. */
function useAuthed() {
  return useSession((s) => s.isAuthenticated && !s.isInitializing);
}

interface QueryExtras {
  enabled?: boolean;
  staleTime?: number;
}

/* --------------------------------------------------------- dashboard ---- */

export function useDashboard(options: QueryExtras = {}) {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => watchEntitlement('mobile_app', () => api.dashboard.get({ signal })),
    enabled: enabled && options.enabled !== false,
    staleTime: options.staleTime ?? 20_000,
  });

  const metrics = useMemo<HomeMetrics | null>(() => {
    const data = query.data;
    if (!isShopkeeperDashboard(data)) return null;
    return {
      todaysMessages: data.todayMessages ?? 0,
      unreadChats: data.unreadConversations ?? 0,
      todaysOrders: data.todayOrders ?? 0,
      pendingOrders: data.pendingOrders ?? 0,
      todaysSales: data.todaySales ?? 0,
      customerCount: data.customerCount ?? 0,
    };
  }, [query.data]);

  const shopkeeper = isShopkeeperDashboard(query.data) ? query.data : null;

  return {
    ...query,
    metrics,
    recentConversations: shopkeeper?.recentConversations ?? [],
    recentOrders: shopkeeper?.recentOrders ?? [],
    whatsapp: shopkeeper?.whatsapp ?? null,
    /** True when signed into a tenant the shop dashboard does not apply to. */
    isNonShopTenant: !!query.data && !shopkeeper,
  };
}

/* ---------------------------------------------------------- whatsapp ---- */

export function useWhatsApp(options: QueryExtras = {}) {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.whatsapp,
    queryFn: ({ signal }) => watchEntitlement('whatsapp', () => api.whatsapp.get({ signal })),
    enabled: enabled && options.enabled !== false,
    staleTime: 60_000,
  });
  return {
    ...query,
    status: toWhatsAppStatus(query.data?.health),
    health: query.data?.health ?? null,
    caps: query.data?.caps ?? null,
  };
}

/* ------------------------------------------------------------- shop ----- */

export function useShop() {
  const enabled = useAuthed();
  const tenantQuery = useQuery({
    queryKey: queryKeys.tenant,
    queryFn: ({ signal }) => watchEntitlement('settings', () => api.tenant.get({ signal })),
    enabled,
    staleTime: 120_000,
  });
  const whatsapp = useWhatsApp();

  const shop = useMemo(
    () =>
      toShop(tenantQuery.data?.tenant ?? null, tenantQuery.data?.profile ?? null, {
        phoneNumber: whatsapp.health?.phone?.displayPhoneNumber ?? null,
        status: whatsapp.status,
      }),
    [tenantQuery.data, whatsapp.health, whatsapp.status],
  );

  return { ...tenantQuery, shop, profile: tenantQuery.data?.profile ?? null };
}

export function useUpdateShopProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: ShopkeeperProfilePatch) => api.tenant.update(patch),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.tenant });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* ------------------------------------------------------ conversations --- */

export function useConversations(params: { search?: string; unread?: boolean } = {}) {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.conversations(params),
    queryFn: ({ signal }) =>
      watchEntitlement('inbox', () => api.conversations.list({ ...params, limit: 200 }, { signal })),
    enabled,
    staleTime: 15_000,
  });
  const conversations = useMemo<Conversation[]>(
    () => (query.data?.conversations ?? []).map((c) => toConversation(c)),
    [query.data],
  );
  return { ...query, conversations, hasMore: query.data?.pagination?.hasMore ?? false };
}

export function useConversation(id: string | undefined) {
  const enabled = useAuthed() && !!id;
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.conversation(id ?? ''),
    queryFn: ({ signal }) =>
      watchEntitlement('inbox', () => api.conversations.get(Number(id), { signal })),
    enabled,
    staleTime: 10_000,
  });

  const conversation = useMemo<Conversation | null>(
    () => (query.data ? toConversation(query.data.conversation, query.data.messages) : null),
    [query.data],
  );

  // Opening a conversation clears its unread count server-side, so the inbox
  // and the dashboard badge are both stale once this resolves.
  const markedRead = query.isSuccess;
  useEffect(() => {
    if (!markedRead) return;
    client.invalidateQueries({ queryKey: ['conversations'] });
    client.invalidateQueries({ queryKey: queryKeys.dashboard });
  }, [markedRead, client]);

  return { ...query, conversation };
}

export function useSendMessage(conversationId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      api.messages.send({ conversationId: conversationId ? Number(conversationId) : undefined, ...input }),
    // Nothing is shown as sent until the backend confirms; on success we refetch
    // so the message carries its real id and delivery status.
    onSuccess: () => {
      if (conversationId) client.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      client.invalidateQueries({ queryKey: ['conversations'] });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/* --------------------------------------------------------- customers ---- */

export function useCustomers(params: { search?: string } = {}) {
  const enabled = useAuthed();
  const query = useInfiniteQuery({
    queryKey: queryKeys.contacts(params),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      watchEntitlement('contacts', () =>
        api.contacts.list({ ...params, limit: PAGE_SIZE, offset: pageParam as number }, { signal }),
      ),
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.contacts.length, 0);
      return loaded < (last.pagination?.total ?? 0) ? loaded : undefined;
    },
    enabled,
    staleTime: 30_000,
  });

  const customers = useMemo<Customer[]>(
    () => (query.data?.pages ?? []).flatMap((page) => page.contacts.map(toCustomer)),
    [query.data],
  );
  return { ...query, customers, total: query.data?.pages?.[0]?.pagination?.total ?? customers.length };
}

export function useCustomer(id: string | undefined) {
  const enabled = useAuthed() && !!id;
  const contactQuery = useQuery({
    queryKey: queryKeys.contact(id ?? ''),
    queryFn: ({ signal }) => watchEntitlement('contacts', () => api.contacts.get(Number(id), { signal })),
    enabled,
  });
  // The contact record carries no order history, so the totals on the detail
  // screen come from that customer's own orders.
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders({ contactId: id }),
    queryFn: ({ signal }) =>
      watchEntitlement('orders', () => api.orders.list({ contactId: Number(id), limit: 200 }, { signal })),
    enabled,
  });

  const orders = useMemo<Order[]>(() => (ordersQuery.data?.orders ?? []).map(toOrder), [ordersQuery.data]);
  const customer = useMemo<Customer | null>(() => {
    if (!contactQuery.data) return null;
    const base = toCustomer(contactQuery.data.contact);
    return ordersQuery.isSuccess ? withOrderTotals(base, orders) : base;
  }, [contactQuery.data, ordersQuery.isSuccess, orders]);

  return {
    customer,
    orders,
    isPending: contactQuery.isPending,
    isError: contactQuery.isError,
    error: contactQuery.error,
    refetch: contactQuery.refetch,
    ordersPending: ordersQuery.isPending,
  };
}

function invalidateCustomers(client: QueryClient) {
  client.invalidateQueries({ queryKey: ['contacts'] });
  client.invalidateQueries({ queryKey: queryKeys.dashboard });
}

export function useCreateCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactInput) => api.contacts.create(input),
    onSuccess: () => invalidateCustomers(client),
  });
}

export function useUpdateCustomer(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactInput) => api.contacts.update(Number(id), input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.contact(id) });
      invalidateCustomers(client);
    },
  });
}

export function useArchiveCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.contacts.archive(Number(id)),
    onSuccess: () => invalidateCustomers(client),
  });
}

/* ---------------------------------------------------------- products ---- */

export function useProducts(params: { search?: string; category?: string } = {}) {
  const enabled = useAuthed();
  const query = useInfiniteQuery({
    queryKey: queryKeys.products(params),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      watchEntitlement('products', () =>
        api.products.list({ ...params, limit: PAGE_SIZE, offset: pageParam as number }, { signal }),
      ),
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.products.length, 0);
      return loaded < (last.pagination?.total ?? 0) ? loaded : undefined;
    },
    enabled,
    staleTime: 60_000,
  });

  const products = useMemo<Product[]>(
    () => (query.data?.pages ?? []).flatMap((page) => page.products.map(toProduct)),
    [query.data],
  );
  return { ...query, products, total: query.data?.pages?.[0]?.pagination?.total ?? products.length };
}

export function useProduct(id: string | undefined) {
  const enabled = useAuthed() && !!id;
  const query = useQuery({
    queryKey: queryKeys.product(id ?? ''),
    queryFn: ({ signal }) => watchEntitlement('products', () => api.products.get(Number(id), { signal })),
    enabled,
  });
  return { ...query, product: query.data ? toProduct(query.data.product) : null };
}

function invalidateProducts(client: QueryClient) {
  client.invalidateQueries({ queryKey: ['products'] });
}

export function useCreateProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => api.products.create(input),
    onSuccess: () => invalidateProducts(client),
  });
}

export function useUpdateProduct(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => api.products.update(Number(id), input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.product(id) });
      invalidateProducts(client);
    },
  });
}

export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.products.remove(Number(id)),
    onSuccess: () => invalidateProducts(client),
  });
}

/* ------------------------------------------------------------ orders ---- */

export function useOrders(params: { status?: Order['status']; search?: string } = {}) {
  const enabled = useAuthed();
  const apiParams = { status: params.status === undefined ? undefined : params.status, search: params.search };
  const query = useInfiniteQuery({
    queryKey: queryKeys.orders(apiParams),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      watchEntitlement('orders', () =>
        api.orders.list({ ...apiParams, limit: PAGE_SIZE, offset: pageParam as number }, { signal }),
      ),
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.orders.length, 0);
      return loaded < (last.pagination?.total ?? 0) ? loaded : undefined;
    },
    enabled,
    staleTime: 20_000,
  });

  const orders = useMemo<Order[]>(
    () => (query.data?.pages ?? []).flatMap((page) => page.orders.map(toOrder)),
    [query.data],
  );
  return { ...query, orders, total: query.data?.pages?.[0]?.pagination?.total ?? orders.length };
}

export function useOrder(id: string | undefined) {
  const enabled = useAuthed() && !!id;
  const query = useQuery({
    queryKey: queryKeys.order(id ?? ''),
    queryFn: ({ signal }) => watchEntitlement('orders', () => api.orders.get(Number(id), { signal })),
    enabled,
  });
  return { ...query, order: query.data ? toOrder(query.data.order) : null };
}

function invalidateOrders(client: QueryClient) {
  client.invalidateQueries({ queryKey: ['orders'] });
  client.invalidateQueries({ queryKey: queryKeys.dashboard });
  // Creating an order draws down tracked stock.
  client.invalidateQueries({ queryKey: ['products'] });
}

export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderInput) => api.orders.create(input),
    onSuccess: () => invalidateOrders(client),
  });
}

export function useUpdateOrder(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: OrderPatch) => api.orders.update(Number(id), patch),
    onSuccess: (result) => {
      client.setQueryData(queryKeys.order(id), result);
      invalidateOrders(client);
    },
  });
}

/* -------------------------------------------------- read-only modules --- */

export function useTemplates() {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.templates,
    queryFn: ({ signal }) => watchEntitlement('templates', () => api.templates.list({ signal })),
    enabled,
    staleTime: 120_000,
  });
  return { ...query, templates: useMemo(() => (query.data?.templates ?? []).map(toTemplate), [query.data]) };
}

export function useCampaigns() {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.campaigns,
    queryFn: ({ signal }) => watchEntitlement('campaigns', () => api.campaigns.list({ signal })),
    enabled,
    staleTime: 60_000,
  });
  return { ...query, campaigns: useMemo(() => (query.data?.campaigns ?? []).map(toCampaign), [query.data]) };
}

export function useAutomations() {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.automations,
    queryFn: ({ signal }) => watchEntitlement('automations', () => api.automations.list({ signal })),
    enabled,
    staleTime: 60_000,
  });
  return { ...query, automations: useMemo(() => (query.data?.automations ?? []).map(toAutomation), [query.data]) };
}

export function useTeam() {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.team,
    queryFn: ({ signal }) => watchEntitlement('team', () => api.team.list({ signal })),
    enabled,
    staleTime: 120_000,
  });
  return { ...query, team: useMemo(() => (query.data?.team ?? []).map(toTeamMember), [query.data]) };
}

export function useSubscription() {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.subscription,
    queryFn: ({ signal }) => watchEntitlement('subscription', () => api.subscription.get({ signal })),
    enabled,
    staleTime: 300_000,
  });
  return { ...query, summary: query.data ? toSubscriptionSummary(query.data) : null };
}

/* ----------------------------------------------------- notifications ---- */

export function useNotifications() {
  const enabled = useAuthed();
  const query = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ signal }) =>
      watchEntitlement('notifications', () => api.notifications.list({ limit: 100 }, { signal })),
    enabled,
    staleTime: 30_000,
  });
  useEffect(() => {
    if (enabled && typeof query.data?.unread === 'number') setBackendUnreadBadge(query.data.unread);
  }, [enabled, query.data?.unread]);
  return {
    ...query,
    notifications: useMemo(() => (query.data?.notifications ?? []).map(toNotification), [query.data]),
    unread: query.data?.unread ?? 0,
  };
}

export function useMarkNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => api.notifications.markRead(id ? Number(id) : undefined),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
