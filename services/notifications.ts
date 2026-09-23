import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type { QueryClient } from '@tanstack/react-query';
import { api, type DeviceRegistration } from '@/services/api/endpoints';
import { peekSession } from '@/services/api/client';
import { conversationIdFromNotification, safeNotificationData, type NotificationData } from './notification-routing';

const INSTALLATION_KEY = 'muenot.push.installation-id';
const CHANNEL_ID = 'shopkeeper-messages';
const RETRY_DELAY_MS = 15_000;

let installationPromise: Promise<string> | null = null;
let registrationStartPromise: Promise<boolean> | null = null;
let registrationPromise: Promise<void> = Promise.resolve();
let registered: { sessionId: string; token: string } | null = null;
let lastFailureAt = 0;
let closingSession = false;

if (Platform.OS === 'android') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function installationId(): Promise<string> {
  installationPromise ??= (async () => {
    const stored = await SecureStore.getItemAsync(INSTALLATION_KEY);
    if (stored) return stored;
    const generated = Crypto.randomUUID();
    await SecureStore.setItemAsync(INSTALLATION_KEY, generated);
    return generated;
  })().catch((error) => {
    installationPromise = null;
    throw error;
  });
  return installationPromise;
}

async function permissionGranted(): Promise<boolean> {
  if (Platform.OS !== 'android' || !Device.isDevice) return false;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Shopkeeper messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00583d',
  });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.status === 'granted') return true;
  if (current.status !== 'undetermined' || current.canAskAgain === false) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.status === 'granted';
}

function registerToken(token: string, rotating = false): Promise<void> {
  registrationPromise = registrationPromise.catch(() => {}).then(async () => {
    const sessionId = peekSession()?.sessionId;
    if (closingSession || !sessionId || token.length < 20 || token.length > 4096) return;
    if (registered?.sessionId === sessionId && registered.token === token) return;
    const input: DeviceRegistration = {
      deviceId: await installationId(),
      pushToken: token,
      pushProvider: 'fcm',
      platform: 'android',
      appVersion: (Constants.expoConfig?.version ?? '1.0.0').slice(0, 40),
      deviceName: (Device.deviceName || Device.modelName || 'Android device').slice(0, 120),
    };
    if (rotating && registered?.sessionId === sessionId) await api.devices.update(input);
    else await api.devices.register(input);
    registered = { sessionId, token };
    lastFailureAt = 0;
  });
  return registrationPromise;
}

/** Called after a valid login or restore, and when connectivity returns. */
export function registerCurrentDevice(): Promise<boolean> {
  if (registrationStartPromise) return registrationStartPromise;
  if (closingSession || Date.now() - lastFailureAt < RETRY_DELAY_MS) return Promise.resolve(false);
  registrationStartPromise = (async () => {
    try {
      if (!(await permissionGranted())) return false;
      const token = await Notifications.getDevicePushTokenAsync();
      if (token.type !== 'android' || typeof token.data !== 'string') return false;
      await registerToken(token.data);
      return !closingSession;
    } catch {
      lastFailureAt = Date.now();
      return false;
    } finally {
      registrationStartPromise = null;
    }
  })();
  return registrationStartPromise;
}

export function subscribeToTokenChanges() {
  if (Platform.OS !== 'android' || !Device.isDevice) return () => {};
  const subscription = Notifications.addPushTokenListener((token) => {
    if (token.type !== 'android' || typeof token.data !== 'string') return;
    void registerToken(token.data, true).catch(() => { lastFailureAt = Date.now(); });
  });
  return () => subscription.remove();
}

/** Revoke this installation before its bearer session is revoked. */
export async function revokeCurrentDevice(): Promise<void> {
  if (Platform.OS !== 'android') return;
  closingSession = true;
  await registrationStartPromise?.catch(() => {});
  await registrationPromise.catch(() => {});
  try {
    const id = await SecureStore.getItemAsync(INSTALLATION_KEY);
    if (id && peekSession()) await api.devices.revoke(id);
  } catch {
    // Logout still clears local auth; the backend logout revokes this session.
  }
  registered = null;
  await clearLocalNotificationState();
}

export async function clearLocalNotificationState(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.dismissAllNotificationsAsync().catch(() => {});
  await Notifications.setBadgeCountAsync(0).catch(() => {});
  await Notifications.clearLastNotificationResponseAsync().catch(() => {});
}

export function resetAfterLogout() {
  registered = null;
  closingSession = false;
  lastFailureAt = 0;
}

/** Push signals a refetch; messages and unread counts always come from ERP. */
export function invalidateForPush(client: QueryClient, rawData: unknown) {
  const data = safeNotificationData(rawData);
  void client.invalidateQueries({ queryKey: ['conversations'] });
  void client.invalidateQueries({ queryKey: ['dashboard'] });
  void client.invalidateQueries({ queryKey: ['notifications'] });
  const conversationId = conversationIdFromNotification(data);
  if (conversationId) void client.invalidateQueries({ queryKey: ['conversation', conversationId] });
  if (data.type === 'new_order' || data.type === 'order_status_changed') {
    void client.invalidateQueries({ queryKey: ['orders'] });
  }
}

export function subscribeToPush(
  client: QueryClient,
  onTap: (data: NotificationData, notificationId: string) => void,
) {
  if (Platform.OS !== 'android') return () => {};
  const received = Notifications.addNotificationReceivedListener((notification) => {
    invalidateForPush(client, notification.request.content.data);
  });
  const tapped = Notifications.addNotificationResponseReceivedListener((response) => {
    const notification = response.notification;
    const data = safeNotificationData(notification.request.content.data);
    invalidateForPush(client, data);
    onTap(data, notification.request.identifier);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  });
  let alive = true;
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!alive || !response) return;
    const notification = response.notification;
    const data = safeNotificationData(notification.request.content.data);
    invalidateForPush(client, data);
    onTap(data, notification.request.identifier);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }).catch(() => {});
  return () => {
    alive = false;
    received.remove();
    tapped.remove();
  };
}

export function setBackendUnreadBadge(unread: number) {
  if (Platform.OS !== 'android' || !Number.isFinite(unread)) return;
  void Notifications.setBadgeCountAsync(Math.max(0, Math.floor(unread))).catch(() => {});
}
