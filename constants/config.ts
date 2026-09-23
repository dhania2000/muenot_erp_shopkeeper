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

const environment = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

if (environment === 'staging' && !configuredApiBaseUrl) {
  throw new Error('Staging requires EXPO_PUBLIC_API_BASE_URL.');
}

export const appConfig = {
  environment,
  apiBaseUrl: environment === 'production'
    ? DEFAULT_API_BASE_URL
    : trimSlash(configuredApiBaseUrl || DEFAULT_API_BASE_URL),
  apiTimeoutMs: positiveInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, 20_000),
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL?.trim() || null,
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || null,
  apkAllowedHosts: (process.env.EXPO_PUBLIC_APK_ALLOWED_HOSTS || 'downloads.muenot.co.in,erp.muenot.co.in')
    .split(',').map((host: string) => host.trim().toLowerCase()).filter(Boolean),
} as const;

export const isProductionBuild = appConfig.environment === 'production';
