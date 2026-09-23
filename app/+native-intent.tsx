import { systemPathForCallback } from '@/services/whatsapp-link';

/** Backend callbacks carry no query data or secrets. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return systemPathForCallback(path);
}
