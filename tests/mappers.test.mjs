import test from 'node:test';
import assert from 'node:assert/strict';
import {
  humanDate,
  parseApiDate,
  toAutomation,
  toCampaign,

  toConversation,
  toCustomer,
  toMessage,
  toNotification,
  toOrder,
  toProduct,
  toShop,
  toTemplate,
  toWhatsAppStatus,
  withOrderTotals,
} from '../features/mappers.ts';

/* ------------------------------------------------------------- dates ---- */

test('parses the MySQL DATETIME the API actually returns', () => {
  const date = parseApiDate('2026-09-22 14:05:00');
  assert.ok(date instanceof Date);
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 8);
  assert.equal(date.getDate(), 22);
});

test('a missing or unparseable date never throws', () => {
  assert.equal(parseApiDate(null), null);
  assert.equal(parseApiDate(undefined), null);
  assert.equal(parseApiDate('not a date'), null);
  assert.equal(humanDate(null), '');
});

test('humanDate labels today and yesterday', () => {
  const now = new Date('2026-09-22T18:00:00');
  assert.match(humanDate('2026-09-22 09:30:00', now), /^Today, /);
  assert.equal(humanDate('2026-09-21 09:30:00', now), 'Yesterday');
  // Locale month abbreviations differ between ICU builds ("Sep" vs "Sept"),
  // so assert the shape rather than one runtime's exact wording.
  assert.match(humanDate('2026-09-12 09:30:00', now), /^12 Sep/);
});

/* --------------------------------------------------------- customers ---- */

const contact = {
  id: 7,
  phone: '919876543210',
  name: 'Rajesh Sharma',
  email: null,
  notes: null,
  tags: ['VIP'],
  city: 'Lucknow',
  state: 'UP',
  country: null,
  leadId: null,
  archivedAt: null,
  lastInteractionAt: null,
  createdAt: '2026-09-01 10:00:00',
};

test('a contact becomes a customer with a string id', () => {
  const customer = toCustomer(contact);
  assert.equal(customer.id, '7');
  assert.equal(typeof customer.id, 'string');
  assert.equal(customer.name, 'Rajesh Sharma');
  assert.deepEqual(customer.tags, ['VIP']);
  assert.equal(customer.city, 'Lucknow');
});

test('a contact with no profile name falls back to the phone number', () => {
  assert.equal(toCustomer({ ...contact, name: null }).name, '919876543210');
  assert.equal(toCustomer({ ...contact, name: '   ' }).name, '919876543210');
});

test('order counts are absent until orders are loaded, never invented', () => {
  const customer = toCustomer(contact);
  assert.equal(customer.orderCount, undefined);
  assert.equal(customer.totalSpend, undefined);
});

test('withOrderTotals sums orders and excludes cancelled ones', () => {
  const orders = [
    { total: 500, status: 'completed' },
    { total: 300, status: 'new' },
    { total: 900, status: 'cancelled' },
  ];
  const customer = withOrderTotals(toCustomer(contact), orders);
  assert.equal(customer.orderCount, 3);
  assert.equal(customer.totalSpend, 800);
});

test('an archived contact is flagged', () => {
  assert.equal(toCustomer({ ...contact, archivedAt: '2026-09-10 10:00:00' }).archived, true);
  assert.equal(toCustomer(contact).archived, false);
});

/* ---------------------------------------------------------- products ---- */

const product = {
  id: 3,
  name: 'Basmati Rice 5kg',
  sku: 'RIC-5KG-001',
  category: 'Grocery',
  description: null,
  price: 650,
  offerPrice: 599,
  currency: 'INR',
  imageUrl: null,
  stockStatus: 'low_stock',
  stockQuantity: 4,
  status: 'active',
  createdAt: '2026-09-01 10:00:00',
  updatedAt: '2026-09-01 10:00:00',
};

test('stock status maps from the API underscore form to the UI hyphen form', () => {
  assert.equal(toProduct(product).stock, 'low-stock');
  assert.equal(toProduct({ ...product, stockStatus: 'in_stock' }).stock, 'in-stock');
  assert.equal(toProduct({ ...product, stockStatus: 'out_of_stock' }).stock, 'out-of-stock');
});

test('an unknown stock status degrades to in-stock rather than crashing', () => {
  assert.equal(toProduct({ ...product, stockStatus: 'who_knows' }).stock, 'in-stock');
});

test('nullable product fields become empty strings or undefined, not "null"', () => {
  const mapped = toProduct({ ...product, sku: null, category: null, offerPrice: null, description: null });
  assert.equal(mapped.sku, '');
  assert.equal(mapped.category, '');
  assert.equal(mapped.offerPrice, undefined);
  assert.equal(mapped.description, undefined);
});

test('inactive products are flagged', () => {
  assert.equal(toProduct(product).active, true);
  assert.equal(toProduct({ ...product, status: 'inactive' }).active, false);
});

/* ------------------------------------------------------------ orders ---- */

const order = {
  id: 11,
  orderNumber: 'ORD-00011',
  contactId: 7,
  conversationId: null,
  customerName: 'Rajesh Sharma',
  customerPhone: '919876543210',
  subtotal: 1198,
  discount: 98,
  total: 1100,
  currency: 'INR',
  status: 'processing',
  paymentStatus: 'cod',
  deliveryMethod: 'home_delivery',
  deliveryAddress: 'Shop 12',
  notes: null,
  createdBy: 2,
  createdAt: '2026-09-22 11:00:00',
  updatedAt: '2026-09-22 11:00:00',
  items: [{ id: 1, productId: 3, productName: 'Basmati Rice 5kg', sku: 'RIC', quantity: 2, unitPrice: 599, lineTotal: 1198 }],
};

test('delivery method maps to the UI vocabulary', () => {
  assert.equal(toOrder(order).deliveryMethod, 'delivery');
  assert.equal(toOrder({ ...order, deliveryMethod: 'shop_pickup' }).deliveryMethod, 'pickup');
});

test('order items keep their own name and price', () => {
  const mapped = toOrder(order);
  assert.equal(mapped.items.length, 1);
  assert.equal(mapped.items[0].name, 'Basmati Rice 5kg');
  assert.equal(mapped.items[0].price, 599);
  assert.equal(mapped.items[0].productId, '3');
});

test('an item whose product was deleted keeps a null productId', () => {
  const mapped = toOrder({ ...order, items: [{ ...order.items[0], productId: null }] });
  assert.equal(mapped.items[0].productId, null);
});

test('an order with no customer name falls back to the phone, then to walk-in', () => {
  assert.equal(toOrder({ ...order, customerName: null }).customerName, '919876543210');
  assert.equal(toOrder({ ...order, customerName: null, customerPhone: null }).customerName, 'Walk-in customer');
});

test('an order with no items maps to an empty list', () => {
  assert.deepEqual(toOrder({ ...order, items: undefined }).items, []);
});

/* ----------------------------------------------------- conversations ---- */

const conversation = {
  id: 5,
  contactId: 7,
  integrationId: 1,
  phoneNumber: '919876543210',
  profileName: 'Rajesh',
  leadId: null,
  leadCode: null,
  leadName: null,
  status: 'open',
  priority: 'high',
  assignedAgentId: 2,
  assignedAgentName: 'Priya',
  assignedTeam: 'Sales',
  unreadCount: 3,
  lastMessagePreview: 'Do you have rice?',
  lastMessageAt: '2026-09-22 11:00:00',
  lastCustomerMessageAt: '2026-09-22 11:00:00',
};

test('a conversation carries its assignment and unread count', () => {
  const mapped = toConversation(conversation);
  assert.equal(mapped.id, '5');
  assert.equal(mapped.contactId, '7');
  assert.equal(mapped.unreadCount, 3);
  assert.equal(mapped.assignedStaff, 'Priya');
  assert.equal(mapped.customer.name, 'Rajesh');
});

test('tags come from the team and a non-normal priority only', () => {
  assert.deepEqual(toConversation(conversation).tags, ['Sales', 'high']);
  assert.deepEqual(toConversation({ ...conversation, priority: 'normal', assignedTeam: null }).tags, []);
});

/* --------------------------------------------------------- messages ---- */

const messageRow = {
  id: 90,
  conversation_id: 5,
  wamid: 'wamid.x',
  direction: 'outbound',
  message_type: 'text',
  message_body: 'Yes, 5kg bags in stock.',
  media_id: null,
  media_mime_type: null,
  media_filename: null,
  media_url: null,
  sender_phone: null,
  recipient_phone: null,
  status: 'delivered',
  status_rank: 3,
  meta_timestamp: null,
  error_code: null,
  error_message: null,
  sent_at: null,
  delivered_at: null,
  read_at: null,
  created_at: '2026-09-22 11:05:00',
  updated_at: '2026-09-22 11:05:00',
};

test('snake_case message rows map to the UI message shape', () => {
  const mapped = toMessage(messageRow);
  assert.equal(mapped.direction, 'out');
  assert.equal(mapped.text, 'Yes, 5kg bags in stock.');
  assert.equal(mapped.status, 'delivered');
});

test('inbound messages carry no delivery status', () => {
  const mapped = toMessage({ ...messageRow, direction: 'inbound', status: 'received' });
  assert.equal(mapped.direction, 'in');
  assert.equal(mapped.status, undefined);
});

test('a media message with no body names its type instead of rendering blank', () => {
  const mapped = toMessage({ ...messageRow, message_body: null, message_type: 'image', media_url: 'https://x/y.jpg' });
  assert.equal(mapped.text, '[image]');
});

/* -------------------------------------------------------- templates ---- */

test('Meta template statuses map to the UI buckets', () => {
  const base = { id: 1, name: 't', language: 'en_US', category: 'UTILITY', bodyText: 'hi', buttons: [] };
  assert.equal(toTemplate({ ...base, status: 'APPROVED' }).status, 'approved');
  assert.equal(toTemplate({ ...base, status: 'PENDING' }).status, 'pending');
  assert.equal(toTemplate({ ...base, status: 'REJECTED' }).status, 'rejected');
});

test('an unrecognised template status is shown verbatim, not forced into a bucket', () => {
  const mapped = toTemplate({ id: 1, name: 't', language: 'en', category: null, status: 'PAUSED', bodyText: '', buttons: [] });
  assert.equal(mapped.status, 'other');
  assert.equal(mapped.rawStatus, 'paused');
});

/* -------------------------------------------------------- campaigns ---- */

test('campaign counters are numbers and the raw status is preserved', () => {
  const mapped = toCampaign({
    id: 2,
    name: 'Diwali',
    type: 'broadcast',
    audienceId: null,
    audienceName: null,
    templateName: 'diwali_offer',
    templateLanguage: 'en',
    scheduledAt: null,
    timezone: null,
    status: 'SENDING',
    totalRecipients: 120,
    sentCount: 40,
    deliveredCount: 38,
    readCount: 12,
    failedCount: 2,
    repliedCount: 0,
    createdBy: null,
    createdByName: null,
    launchedAt: null,
    completedAt: null,
    lastError: null,
    createdAt: '2026-09-22 11:00:00',
  });
  assert.equal(mapped.status, 'running');
  assert.equal(mapped.sent, 40);
  assert.equal(mapped.failed, 2);
  // No audience name from the backend, so the recipient count stands in.
  assert.equal(mapped.audience, '120 recipients');
});

/* ------------------------------------------------------- automations ---- */

test('an automation description is built only from backend trigger/action types', () => {
  const mapped = toAutomation({
    id: 1,
    name: 'Welcome',
    isActive: true,
    triggerType: 'first_message',
    actionType: 'send_template',
    triggerConfig: {},
    actionConfig: {},
    departmentId: null,
    departmentName: null,
    priority: 5,
  });
  assert.equal(mapped.enabled, true);
  assert.equal(mapped.description, 'When First Message then Send Template');
});

/* ----------------------------------------------------- notifications ---- */

test('notification read state comes from the is_read integer', () => {
  const row = { id: 1, title: 'New order', body: 'ORD-1', link: null, module_key: 'orders', action: null, actor_name: null, is_read: 0, created_at: '2026-09-22 11:00:00' };
  assert.equal(toNotification(row).read, false);
  assert.equal(toNotification({ ...row, is_read: 1 }).read, true);
  assert.equal(toNotification(row).type, 'order');
  assert.equal(toNotification({ ...row, module_key: 'unknown_module' }).type, 'general');
});

/* --------------------------------------------------------- whatsapp ---- */

test('WhatsApp status is derived from the backend health payload', () => {
  assert.equal(toWhatsAppStatus(null), 'not-connected');
  assert.equal(toWhatsAppStatus({ connected: false, overall: 'disconnected', integration: null }), 'not-connected');
  assert.equal(toWhatsAppStatus({ connected: false, overall: 'down', integration: null }), 'setup-required');
  assert.equal(toWhatsAppStatus({ connected: true, overall: 'healthy', integration: {}, messagingReady: true }), 'messaging-ready');
  assert.equal(toWhatsAppStatus({ connected: true, overall: 'healthy', integration: {} }), 'connected');
  assert.equal(toWhatsAppStatus({ connected: true, overall: 'degraded', integration: {} }), 'action-required');
  assert.equal(toWhatsAppStatus({ connected: true, overall: 'down', integration: {} }), 'failed');
  assert.equal(toWhatsAppStatus({ connected: false, overall: 'healthy', integration: {}, registration: {} }), 'registration-pending');
});

/* ------------------------------------------------------------- shop ---- */

test('the shop falls back to the tenant name when no profile exists', () => {
  const shop = toShop({ id: 1, name: 'Sharma Store', slug: 's', tenantType: 'SHOPKEEPER' }, null);
  assert.equal(shop.name, 'Sharma Store');
  assert.equal(shop.owner, '');
  assert.equal(shop.businessHours.length, 7);
  // Unset hours are reported closed rather than given an invented default.
  assert.equal(shop.businessHours.every((d) => d.enabled === false), true);
});

test('disconnected WhatsApp never borrows the shop contact phone', () => {
  const profile = { tenantId: 1, shopName: 'Sharma Store', phone: '7665748940' };
  assert.equal(toShop(null, profile, { phoneNumber: null, status: 'not-connected' }).whatsappNumber, '');
  assert.equal(toShop(null, profile, { phoneNumber: '7665748940', status: 'action-required' }).whatsappNumber, '');
  assert.equal(toShop(null, profile, { phoneNumber: '+919876543210', status: 'connected' }).whatsappNumber, '+919876543210');
});

test('stored business hours are read back per day', () => {
  const shop = toShop(null, {
    tenantId: 1,
    shopName: 'Sharma Store',
    businessHours: { Monday: { enabled: true, open: '10:00 AM', close: '9:00 PM' } },
  });
  const monday = shop.businessHours.find((d) => d.day === 'Monday');
  assert.equal(monday.enabled, true);
  assert.equal(monday.open, '10:00 AM');
  assert.equal(shop.businessHours.find((d) => d.day === 'Sunday').enabled, false);
});
