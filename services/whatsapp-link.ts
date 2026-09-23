export function callbackOutcome(raw: string): 'connected' | 'error' | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'muenot:' || url.hostname !== 'whatsapp' || url.search || url.hash) return null;
    if (url.pathname === '/connected') return 'connected';
    if (url.pathname === '/error') return 'error';
  } catch { /* invalid callback */ }
  return null;
}

export function systemPathForCallback(path: string): string {
  const relative = /^\/?whatsapp\/(connected|error)\/?$/.exec(path);
  const outcome = relative?.[1] ?? callbackOutcome(path);
  if (outcome) return `/whatsapp/return?result=${outcome}`;
  return path;
}

export function isSafeOnboardingUrl(raw: string, apiBaseUrl: string): boolean {
  try {
    const url = new URL(raw);
    const api = new URL(apiBaseUrl);
    return url.protocol === 'https:' && url.origin === api.origin && url.pathname === '/mobile/whatsapp/connect'
      && /^#session=[A-Za-z0-9_-]{40,64}$/.test(url.hash) && !url.search;
  } catch { return false; }
}
