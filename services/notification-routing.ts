/** Only routes present in this app can be opened from untrusted FCM data. */
export type NotificationData = Record<string, unknown>;

export function safeNotificationData(value: unknown): NotificationData {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as NotificationData : {};
}

export function conversationIdFromNotification(value: unknown): string | null {
  const data = safeNotificationData(value);
  if (data.type !== 'whatsapp_message' && data.type !== 'conversation_assigned') return null;
  const id = data.conversationId;
  const text = typeof id === 'string' ? id : typeof id === 'number' ? String(id) : '';
  return /^[1-9]\d{0,14}$/.test(text) ? text : null;
}

export function notificationDestination(value: unknown): string {
  const data = safeNotificationData(value);
  switch (data.type) {
    case 'whatsapp_message':
    case 'conversation_assigned': {
      const id = conversationIdFromNotification(data);
      return id ? `/inbox/${id}` : '/notifications';
    }
    case 'new_order':
    case 'order_status_changed':
      return '/orders';
    case 'campaign_status':
      return '/more/campaigns';
    case 'subscription_warning':
      return '/more/subscription';
    default:
      return '/notifications';
  }
}

/** Existing ERP notification rows use a web link for WhatsApp conversations. */
export function notificationCenterDestination(link: unknown): string | null {
  if (typeof link !== 'string') return null;
  const match = /^\/modules\/whatsapp\?conversation=([1-9]\d{0,14})$/.exec(link);
  return match ? `/inbox/${match[1]}` : null;
}
