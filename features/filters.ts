import type { Conversation, Customer, Order, Product } from '@/types/domain';

/**
 * Client-side list filtering.
 *
 * Search is also a backend query parameter for conversations, contacts,
 * products and orders — these run over the page already in hand so the list
 * stays responsive while a refetch is in flight, and so filters the API does
 * not support (assigned/unassigned) still work.
 */

export const inboxFilters = ['all', 'unread', 'assigned', 'unassigned'] as const;
export const orderFilters = ['all', 'new', 'processing', 'completed', 'cancelled'] as const;
export type InboxFilter = (typeof inboxFilters)[number];
export type OrderFilter = (typeof orderFilters)[number];

const match = (value: string | undefined, q: string) => !q || (value ?? '').toLowerCase().includes(q.toLowerCase());

export function filterCustomers(list: Customer[], q: string) {
  return list.filter((x) => match(x.name, q) || x.phone.includes(q) || match(x.email, q));
}

export function filterConversations(list: Conversation[], filter: InboxFilter, q: string) {
  return list.filter(
    (x) =>
      (filter === 'all' ||
        (filter === 'unread' && x.unreadCount > 0) ||
        (filter === 'assigned' && !!x.assignedStaff) ||
        (filter === 'unassigned' && !x.assignedStaff)) &&
      (match(x.customer.name, q) || x.customer.phone.includes(q)),
  );
}

export function filterOrders(list: Order[], filter: OrderFilter) {
  return list.filter((x) => filter === 'all' || x.status === filter);
}

export function filterProducts(list: Product[], category: string, q: string) {
  return list.filter((x) => (category === 'all' || x.category === category) && (match(x.name, q) || match(x.sku, q)));
}

/** Categories present in the loaded page — the API has no categories endpoint. */
export function productCategories(list: Product[]) {
  return ['all', ...new Set(list.map((x) => x.category).filter(Boolean))];
}
