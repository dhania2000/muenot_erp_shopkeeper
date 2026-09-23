import * as WebBrowser from 'expo-web-browser';
import { api } from '@/services/api/endpoints';
import { appConfig } from '@/constants/config';
import { callbackOutcome, isSafeOnboardingUrl } from './whatsapp-link';

export { callbackOutcome, isSafeOnboardingUrl } from './whatsapp-link';

let starting: Promise<'connected' | 'error' | 'cancelled'> | null = null;

/** Single-flight launch shared by dashboard, Inbox and settings. */
export function startWhatsAppOnboarding(): Promise<'connected' | 'error' | 'cancelled'> {
  if (starting) return starting;
  starting = (async () => {
    const session = await api.whatsapp.onboardingSession();
    if (!isSafeOnboardingUrl(session.url, appConfig.apiBaseUrl)) throw new Error('The connection link from Muenot is invalid. Please try again.');
    const result = await WebBrowser.openAuthSessionAsync(session.url, 'muenot://whatsapp/');
    if (result.type === 'success') return callbackOutcome(result.url) ?? 'error';
    return 'cancelled';
  })().finally(() => { starting = null; });
  return starting;
}
