import type { ApiErrorBody } from '@/types/api';

/**
 * Every failure the API client surfaces is one of these, so screens never have
 * to tell a DNS failure apart from a 500 by inspecting a raw exception.
 */
export type ApiErrorKind =
  | 'offline'      // no route to the host
  | 'timeout'      // request exceeded the configured deadline
  | 'cancelled'    // caller aborted (screen unmounted, query superseded)
  | 'unauthorized' // 401 — token missing, expired or revoked
  | 'forbidden'    // 403 — permission or plan entitlement denied
  | 'notFound'     // 404
  | 'conflict'     // 409 — duplicate SKU, duplicate phone, MFA required
  | 'validation'   // 422 (and 400) — see `fields`
  | 'rateLimited'  // 429 — see `retryAfterSeconds`
  | 'server'       // 5xx
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  /** Machine-readable code from the backend, e.g. `invalid_token`, `not_entitled`. */
  readonly code?: string;
  /** Field-level messages from a 422. */
  readonly fields?: Record<string, string>;
  readonly retryAfterSeconds?: number;

  constructor(init: {
    kind: ApiErrorKind;
    status: number;
    message: string;
    code?: string;
    fields?: Record<string, string>;
    retryAfterSeconds?: number;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code;
    this.fields = init.fields;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  /** True when the tenant's plan does not include the feature that was called. */
  get isNotEntitled() {
    return this.kind === 'forbidden' && this.code === 'not_entitled';
  }

  /** Retrying the identical request could plausibly succeed. */
  get isRetryable() {
    return this.kind === 'offline' || this.kind === 'timeout' || this.kind === 'server' || this.kind === 'rateLimited';
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409 || status === 423) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** Wording shown to a shopkeeper when the backend gives us nothing better. */
const FALLBACK: Partial<Record<ApiErrorKind, string>> = {
  offline: 'No internet connection. Check your network and try again.',
  timeout: 'The server took too long to respond. Try again.',
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: 'You do not have permission to do that.',
  notFound: 'That item could not be found.',
  validation: 'Please check the details you entered.',
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  server: 'The server is unavailable right now. Try again shortly.',
  unknown: 'Something went wrong. Try again.',
};

export function apiErrorFromResponse(status: number, body: unknown, retryAfterHeader: string | null): ApiError {
  const kind = kindForStatus(status);
  const parsed = (body && typeof body === 'object' ? body : {}) as Partial<ApiErrorBody>;
  const retryAfter = Number(retryAfterHeader);
  return new ApiError({
    kind,
    status,
    message: typeof parsed.error === 'string' && parsed.error ? parsed.error : (FALLBACK[kind] ?? FALLBACK.unknown!),
    code: typeof parsed.code === 'string' ? parsed.code : undefined,
    fields: parsed.fields && typeof parsed.fields === 'object' ? parsed.fields : undefined,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  });
}

export const offlineError = () => new ApiError({ kind: 'offline', status: 0, message: FALLBACK.offline! });
export const timeoutError = () => new ApiError({ kind: 'timeout', status: 0, message: FALLBACK.timeout! });
export const cancelledError = () => new ApiError({ kind: 'cancelled', status: 0, message: 'Request cancelled.' });

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** Safe to show in an Alert or inline error row. */
export function errorMessage(value: unknown): string {
  if (isApiError(value)) return value.message;
  if (value instanceof Error && value.message) return value.message;
  return FALLBACK.unknown!;
}
