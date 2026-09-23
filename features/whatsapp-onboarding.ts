import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queries';
import { startWhatsAppOnboarding } from '@/services/whatsapp-onboarding';
import { isApiError } from '@/services/api/errors';

export function useWhatsAppOnboarding() {
  const busy = useRef(false);
  const [isConnecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useQueryClient();
  const start = async () => {
    if (busy.current) return;
    busy.current = true;
    setConnecting(true);
    setError(null);
    try {
      const outcome = await startWhatsAppOnboarding();
      if (outcome === 'cancelled') return;
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.whatsappConnection }),
        client.invalidateQueries({ queryKey: queryKeys.whatsapp }),
        client.invalidateQueries({ queryKey: queryKeys.dashboard }),
        client.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      router.replace(`/whatsapp/return?result=${outcome}`);
    } catch (e) { setError(isApiError(e) ? e.message : 'Could not open WhatsApp connection. Please try again.'); }
    finally { busy.current = false; setConnecting(false); }
  };
  return { start, isConnecting, error };
}
