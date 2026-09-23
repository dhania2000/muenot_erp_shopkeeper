import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conversationIdFromNotification,
  notificationCenterDestination,
  notificationDestination,
} from '../services/notification-routing.ts';

test('the backend WhatsApp push opens the exact existing chat route', () => {
  const data = { type: 'whatsapp_message', route: '/modules/whatsapp?conversation=42', conversationId: '42' };
  assert.equal(notificationDestination(data), '/inbox/42');
  assert.equal(conversationIdFromNotification(data), '42');
});

test('untrusted or incomplete push data safely opens Notification Center', () => {
  for (const data of [null, [], 'bad', {}, { type: 'unknown', route: 'https://evil.example' },
    { type: 'whatsapp_message' }, { type: 'whatsapp_message', conversationId: '../login' },
    { type: 'whatsapp_message', conversationId: '0' }]) {
    assert.equal(notificationDestination(data), '/notifications');
  }
});

test('only implemented destinations are selected for other event types', () => {
  assert.equal(notificationDestination({ type: 'new_order' }), '/orders');
  assert.equal(notificationDestination({ type: 'campaign_status' }), '/more/campaigns');
  assert.equal(notificationDestination({ type: 'subscription_warning' }), '/more/subscription');
  for (const type of ['SHOPKEEPER_APPROVED', 'SHOPKEEPER_REJECTED', 'SHOPKEEPER_SUSPENDED']) {
    assert.equal(notificationDestination({ type }), '/registration/status');
  }
});

test('backend notification-center links permit only a numeric WhatsApp conversation', () => {
  assert.equal(notificationCenterDestination('/modules/whatsapp?conversation=42'), '/inbox/42');
  assert.equal(notificationCenterDestination('https://evil.example'), null);
  assert.equal(notificationCenterDestination('/modules/whatsapp?conversation=../login'), null);
});
