import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { appConfig } from '@/constants/config';
import type { AuthTokens } from '@/types/api';

/**
 * Persistence for the mobile session.
 *
 * Tokens live in the OS keystore (Android Keystore / iOS Keychain) via
 * SecureStore and NEVER in AsyncStorage — AsyncStorage is plain, world-readable
 * on a rooted device.
 *
 * A copy is also held in memory so the hot path of every request does not have
 * to touch native storage.
 */

/* ------------------------------------------------------------ backend --- */

/**
 * expo-secure-store ships an empty stub for web, so `expo start --web` cannot
 * hold a session at all. Web is NOT a shipped platform here (app.config.ts
 * declares android and ios only) — it exists purely so the app can be smoke
 * tested in a browser without an Android SDK.
 *
 * On that path only, and never in a production build, fall back to
 * localStorage. A browser has no keystore, so there is nothing safer to use;
 * the guard below is what stops this ever becoming the shipped behaviour.
 */
const isWebDevFallback = Platform.OS === 'web';

if (isWebDevFallback && appConfig.environment === 'production') {
  throw new Error(
    'Refusing to run a production web build: there is no secure token storage in a browser. Build for Android instead.',
  );
}

const storage = {
  getItem: (key: string): Promise<string | null> => {
    if (isWebDevFallback) return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (isWebDevFallback) {
      globalThis.localStorage?.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: (key: string): Promise<void> => {
    if (isWebDevFallback) {
      globalThis.localStorage?.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const ACCESS_KEY = 'muenot.session.access';
const REFRESH_KEY = 'muenot.session.refresh';
/** Non-sensitive session metadata, kept beside the tokens for simplicity. */
const META_KEY = 'muenot.session.meta';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  /** Epoch ms at which the access token stops being accepted. */
  accessExpiresAt: number;
  /** Epoch ms at which the refresh token stops being accepted. */
  refreshExpiresAt: number;
}

interface StoredMeta {
  sessionId: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
}

let cached: StoredSession | null = null;
let loaded = false;

/**
 * Treat the access token as expired slightly early so a request that is about
 * to be sent does not race the server clock.
 */
const EXPIRY_SKEW_MS = 30_000;

export function sessionFromTokens(tokens: AuthTokens): StoredSession {
  const refreshExpiresAt = Date.parse(tokens.refreshExpiresAt);
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionId: tokens.sessionId,
    accessExpiresAt: Date.now() + tokens.expiresIn * 1000,
    refreshExpiresAt: Number.isFinite(refreshExpiresAt) ? refreshExpiresAt : Date.now() + 30 * 86_400_000,
  };
}

export async function loadSession(): Promise<StoredSession | null> {
  if (loaded) return cached;
  try {
    const [accessToken, refreshToken, rawMeta] = await Promise.all([
      storage.getItem(ACCESS_KEY),
      storage.getItem(REFRESH_KEY),
      storage.getItem(META_KEY),
    ]);
    if (accessToken && refreshToken && rawMeta) {
      const meta = JSON.parse(rawMeta) as StoredMeta;
      cached = { accessToken, refreshToken, ...meta };
    } else {
      cached = null;
    }
  } catch {
    // A corrupt or unreadable keystore entry is treated as "no session" rather
    // than a hard failure; the user simply logs in again.
    cached = null;
  }
  loaded = true;
  return cached;
}

export async function saveSession(session: StoredSession): Promise<void> {
  cached = session;
  loaded = true;
  const meta: StoredMeta = {
    sessionId: session.sessionId,
    accessExpiresAt: session.accessExpiresAt,
    refreshExpiresAt: session.refreshExpiresAt,
  };
  await Promise.all([
    storage.setItem(ACCESS_KEY, session.accessToken),
    storage.setItem(REFRESH_KEY, session.refreshToken),
    storage.setItem(META_KEY, JSON.stringify(meta)),
  ]);
}

export async function clearSession(): Promise<void> {
  cached = null;
  loaded = true;
  await Promise.all([
    storage.deleteItem(ACCESS_KEY).catch(() => {}),
    storage.deleteItem(REFRESH_KEY).catch(() => {}),
    storage.deleteItem(META_KEY).catch(() => {}),
  ]);
}

/** Synchronous read of the in-memory copy; null until loadSession() has run. */
export function peekSession(): StoredSession | null {
  return cached;
}

export function isAccessExpired(session: StoredSession, now = Date.now()): boolean {
  return now >= session.accessExpiresAt - EXPIRY_SKEW_MS;
}

export function isRefreshExpired(session: StoredSession, now = Date.now()): boolean {
  return now >= session.refreshExpiresAt;
}
