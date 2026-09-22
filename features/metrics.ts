import type { OrderItem } from '@/types/domain';

/**
 * Order arithmetic used by the create-order flow to show a running total
 * before the order exists.
 *
 * The authoritative subtotal, discount and total are always the ones the
 * backend returns on POST /orders — this is a preview only, and the order
 * number is issued server-side.
 */

export function orderSubtotal(items: OrderItem[]) {
  return items.reduce((sum, x) => sum + x.price * x.quantity, 0);
}

export function orderTotal(items: OrderItem[], discount = 0) {
  return Math.max(0, orderSubtotal(items) - discount);
}
