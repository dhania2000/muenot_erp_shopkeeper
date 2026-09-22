/**
 * Public runtime configuration. Only EXPO_PUBLIC_* values are readable here and
 * every one of them ships inside the APK — never put a secret in this file.
 */
const DEFAULT_API_BASE_URL = 'https://erp.muenot.co.in/api/mobile/v1';

const trimSlash = (value: string) => value.replace(/\/+$/, '');
const positiveInt = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export const appConfig = {
  environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  apiBaseUrl: trimSlash(process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL),
  apiTimeoutMs: positiveInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, 20_000),
} as const;

export const isProductionBuild = appConfig.environment === 'production';
