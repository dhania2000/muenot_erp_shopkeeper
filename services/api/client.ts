import { appConfig } from '@/constants/config';
import type { AuthTokens } from '@/types/api';
import { ApiError, apiErrorFromResponse, cancelledError, offlineError, timeoutError } from './errors';
import {
  clearSession,
  isAccessExpired,
  isRefreshExpired,
  loadSession,
  peekSession,
  saveSession,
  sessionFromTokens,
  type StoredSession,
} from './session-store';

/**
 * The single HTTP entry point for the app. Screens never call fetch directly;
 * they call the typed wrappers in services/api/endpoints.ts, which call this.
 *
 * Responsibilities: base URL, auth header, proactive and reactive token
 * refresh (single-flight, because the backend ROTATES the refresh token and a
 * concurrent second refresh would revoke the first one's result), timeout,
 * cancellation, bounded retry for safe verbs, and error normalisation.
 */

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** JSON request body. Serialised as-is; undefined values are dropped. */
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Caller-owned cancellation, combined with the internal timeout. */
  signal?: AbortSignal;
  /** Set false for the unauthenticated auth endpoints. */
  auth?: boolean;
  timeoutMs?: number;
  /** Extra attempts after the first for retryable failures. GET defaults to 2. */
  retries?: number;
}

/** Notified when the session is gone for good, so the app can route to Login. */
type ExpiryListener = () => void;
const expiryListeners = new Set<ExpiryListener>();

export function onSessionExpired(listener: ExpiryListener): () => void {
  expiryListeners.add(listener);
  return () => expiryListeners.delete(listener);
}

async function endSession() {
  await clearSession();
  expiryListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* a misbehaving listener must not break the request that triggered it */
    }
  });
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${appConfig.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* ----------------------------------------------------------- refresh ---- */

let refreshInFlight: Promise<StoredSession | null> | null = null;

/**
 * Exchanges the stored refresh token for a new pair. The backend revokes the
 * presented refresh token as part of this call, so the result must be saved
 * before any other request uses it — hence the shared promise.
 */
async function refreshTokens(): Promise<StoredSession | null> {
  const current = peekSession() ?? (await loadSession());
  if (!current || isRefreshExpired(current)) {
    await endSession();
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), appConfig.apiTimeoutMs);
  try {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
      signal: controller.signal,
    });
    if (!response.ok) {
      // 401/invalid_refresh_token is terminal: the token was rotated, revoked
      // or expired. Anything else (a 5xx, say) leaves the session intact so a
      // later attempt can still succeed.
      if (response.status === 401 || response.status === 403) await endSession();
      return null;
    }
    const tokens = (await response.json()) as AuthTokens;
    if (!tokens?.accessToken || !tokens?.refreshToken) {
      await endSession();
      return null;
    }
    const next = sessionFromTokens(tokens);
    await saveSession(next);
    return next;
  } catch {
    // Network failure during refresh: keep the session so the user is not
    // logged out merely for being offline.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Collapses concurrent refreshes into one in-flight call. */
function refreshOnce(): Promise<StoredSession | null> {
  refreshInFlight ??= refreshTokens().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** Forces a refresh now; used by the session store's refreshSession(). */
export function forceRefresh(): Promise<StoredSession | null> {
  return refreshOnce();
}

/* ----------------------------------------------------------- request ---- */

interface Attempt {
  status: number;
  body: unknown;
  retryAfter: string | null;
}

async function send(url: string, init: RequestInit, timeoutMs: number, external?: AbortSignal): Promise<Attempt> {
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (external) {
    if (external.aborted) throw cancelledError();
    external.addEventListener('abort', onExternalAbort);
  }
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        // A non-JSON body means we hit something other than the API (an HTML
        // 404 from the host, a captive portal). Keep the text for the message.
        body = { error: response.ok ? 'Unexpected response from the server.' : text.slice(0, 200) };
      }
    }
    return { status: response.status, body, retryAfter: response.headers.get('Retry-After') };
  } catch (error) {
    if (timedOut) throw timeoutError();
    if (external?.aborted) throw cancelledError();
    if (error instanceof ApiError) throw error;
    // fetch only rejects for network-level failures once we have excluded abort.
    throw offlineError();
  } finally {
    clearTimeout(timer);
    if (external) external.removeEventListener('abort', onExternalAbort);
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, auth = true, timeoutMs = appConfig.apiTimeoutMs } = options;
  const idempotent = method === 'GET';
  const maxAttempts = 1 + (options.retries ?? (idempotent ? 2 : 0));
  const url = buildUrl(path, query);

  let session: StoredSession | null = null;
  if (auth) {
    session = peekSession() ?? (await loadSession());
    if (!session) throw new ApiError({ kind: 'unauthorized', status: 401, message: 'You are not logged in.', code: 'no_session' });
    // Proactive refresh: cheaper than eating a guaranteed 401 round trip.
    if (isAccessExpired(session)) {
      session = (await refreshOnce()) ?? peekSession();
      if (!session || isAccessExpired(session)) {
        throw new ApiError({ kind: 'unauthorized', status: 401, message: 'Your session has expired. Please log in again.', code: 'session_expired' });
      }
    }
  }

  let refreshedOnce = false;
  let lastError: ApiError | null = null;
  // Counted manually: replaying a request after a successful token refresh is
  // not a retry and must not consume the budget, or a mutation (budget 1)
  // would fail outright the first time its access token expired mid-flight.
  let attempt = 0;

  while (attempt < maxAttempts) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const active = peekSession();
      if (!active) throw new ApiError({ kind: 'unauthorized', status: 401, message: 'Your session has expired. Please log in again.', code: 'session_expired' });
      headers.Authorization = `Bearer ${active.accessToken}`;
    }

    let result: Attempt;
    try {
      result = await send(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }, timeoutMs, signal);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.kind === 'cancelled') throw apiError;
      lastError = apiError;
      if (attempt + 1 < maxAttempts && apiError.isRetryable) {
        await sleep(250 * 2 ** attempt);
        attempt++;
        continue;
      }
      throw apiError;
    }

    if (result.status >= 200 && result.status < 300) return result.body as T;

    const error = apiErrorFromResponse(result.status, result.body, result.retryAfter);

    // A 401 mid-flight means the access token was revoked or the clock drifted.
    // Refresh once and replay; a second 401 ends the session.
    if (auth && error.kind === 'unauthorized' && !refreshedOnce) {
      refreshedOnce = true;
      const renewed = await refreshOnce();
      // Deliberately does not increment `attempt`: this is a replay with a
      // fresh token, not a retry of a failed request.
      if (renewed) continue;
      await endSession();
      throw new ApiError({ kind: 'unauthorized', status: 401, message: 'Your session has expired. Please log in again.', code: 'session_expired' });
    }
    if (auth && error.kind === 'unauthorized') {
      await endSession();
      throw error;
    }

    // Retry only what is safe to repeat. A 429 is honoured for GET as well,
    // waiting out Retry-After when the server supplies it.
    const retryable = idempotent && (error.kind === 'server' || error.kind === 'rateLimited');
    if (retryable && attempt + 1 < maxAttempts) {
      lastError = error;
      const waitMs = error.retryAfterSeconds ? Math.min(error.retryAfterSeconds * 1000, 10_000) : 250 * 2 ** attempt;
      await sleep(waitMs);
      attempt++;
      continue;
    }
    throw error;
  }

  throw lastError ?? new ApiError({ kind: 'unknown', status: 0, message: 'The request could not be completed.' });
}

/** Replaces the stored session after a successful login. */
export async function adoptTokens(tokens: AuthTokens): Promise<StoredSession> {
  const session = sessionFromTokens(tokens);
  await saveSession(session);
  return session;
}

export { clearSession, loadSession, peekSession };
