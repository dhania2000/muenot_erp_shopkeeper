import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterConversations,
  filterCustomers,
  filterOrders,
  filterProducts,
  inboxFilters,
  orderFilters,
  productCategories,
} from '../features/filters.ts';

const customers = [
  { id: '1', name: 'Rajesh Sharma', phone: '919876543210', email: 'raj@shop.com', tags: [] },
  { id: '2', name: 'Anita Verma', phone: '919812345678', email: null, tags: [] },
];

test('customers match on name, phone or email', () => {
  assert.equal(filterCustomers(customers, 'rajesh').length, 1);
  assert.equal(filterCustomers(customers, '9812').length, 1);
  assert.equal(filterCustomers(customers, 'raj@shop').length, 1);
  assert.equal(filterCustomers(customers, '').length, 2);
});

test('a customer with no email does not break the email match', () => {
  assert.doesNotThrow(() => filterCustomers(customers, 'anita'));
  assert.equal(filterCustomers(customers, 'anita')[0].id, '2');
});

const conversations = [
  { id: '1', customer: { name: 'Rajesh', phone: '919876543210' }, unreadCount: 2, assignedStaff: 'Priya' },
  { id: '2', customer: { name: 'Anita', phone: '919812345678' }, unreadCount: 0, assignedStaff: undefined },
];

test('inbox filters split unread and assignment', () => {
  assert.deepEqual(inboxFilters, ['all', 'unread', 'assigned', 'unassigned']);
  assert.equal(filterConversations(conversations, 'all', '').length, 2);
  assert.equal(filterConversations(conversations, 'unread', '')[0].id, '1');
  assert.equal(filterConversations(conversations, 'assigned', '')[0].id, '1');
  assert.equal(filterConversations(conversations, 'unassigned', '')[0].id, '2');
});

test('conversation search matches the customer name or number', () => {
  assert.equal(filterConversations(conversations, 'all', 'anita').length, 1);
  assert.equal(filterConversations(conversations, 'all', '9876').length, 1);
});

const orders = [
  { id: '1', status: 'new' },
  { id: '2', status: 'completed' },
  { id: '3', status: 'cancelled' },
];

test('order filters cover every backend status', () => {
  assert.deepEqual(orderFilters, ['all', 'new', 'processing', 'completed', 'cancelled']);
  assert.equal(filterOrders(orders, 'all').length, 3);
  assert.equal(filterOrders(orders, 'completed')[0].id, '2');
  assert.equal(filterOrders(orders, 'processing').length, 0);
});

const products = [
  { id: '1', name: 'Basmati Rice 5kg', sku: 'RIC-5KG', category: 'Grocery' },
  { id: '2', name: 'Cotton Kurta', sku: 'KUR-01', category: 'Clothing' },
  { id: '3', name: 'Loose item', sku: '', category: '' },
];

test('products match on name or SKU and filter by category', () => {
  assert.equal(filterProducts(products, 'all', 'rice').length, 1);
  assert.equal(filterProducts(products, 'all', 'KUR').length, 1);
  assert.equal(filterProducts(products, 'Grocery', '').length, 1);
  assert.equal(filterProducts(products, 'all', '').length, 3);
});

test('category chips are unique and skip products with no category', () => {
  assert.deepEqual(productCategories(products), ['all', 'Grocery', 'Clothing']);
});
