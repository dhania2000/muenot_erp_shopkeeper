import test from 'node:test';
import assert from 'node:assert/strict';
import { orderSubtotal, orderTotal } from '../features/metrics.ts';

const items = [
  { productId: '1', name: 'Rice', quantity: 2, price: 599 },
  { productId: '2', name: 'Kurta', quantity: 1, price: 1200 },
];

test('subtotal multiplies quantity by price across lines', () => {
  assert.equal(orderSubtotal(items), 2398);
});

test('an empty cart has a zero subtotal', () => {
  assert.equal(orderSubtotal([]), 0);
});

test('total subtracts the discount', () => {
  assert.equal(orderTotal(items, 398), 2000);
  assert.equal(orderTotal(items), 2398);
});

test('a discount larger than the subtotal never yields a negative total', () => {
  // The backend rejects this with a 422; the preview must not show a negative
  // figure while the shopkeeper is still typing.
  assert.equal(orderTotal(items, 99999), 0);
});
