import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, Header } from '@/components/screen';
import { Button, Icon } from '@/components/ui';
import { colors } from '@/constants/theme';
import { api } from '@/services/api/endpoints';
import { errorMessage } from '@/services/api/errors';
import { useSession } from '@/features/session';
import { queryKeys } from '@/features/queries';
import { useWhatsAppOnboarding } from '@/features/whatsapp-onboarding';
import type { WhatsAppConnectionStatus } from '@/types/api';

export default function WhatsAppReturn() {
  const { result } = useLocalSearchParams<{ result?: string }>();
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  const isInitializing = useSession((s) => s.isInitializing);
  const client = useQueryClient();
  const [status, setStatus] = useState<WhatsAppConnectionStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onboarding = useWhatsAppOnboarding();
  const check = async () => {
    if (!isAuthenticated) return;
    setChecking(true); setError(null);
    try {
      const next = await api.whatsapp.status();
      setStatus(next);
      client.setQueryData(queryKeys.whatsappConnection, next);
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.dashboard }),
        client.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
    } catch (e) { setError(errorMessage(e)); }
    finally { setChecking(false); }
  };
  useEffect(() => { if (!isInitializing) void check(); }, [isInitializing, isAuthenticated]);
  if (!isInitializing && !isAuthenticated) return <Screen><Header title="WhatsApp" back={false} /><View style={s.content}><Text style={s.text}>Sign in to check your WhatsApp connection.</Text><Button title="Login" onPress={() => router.replace('/login')} /></View></Screen>;
  const connected = status?.connected === true && status.status === 'CONNECTED';
  const title = checking ? 'Verifying connection…' : connected ? 'WhatsApp connected' : result === 'error' ? 'Could not connect WhatsApp' : status?.status === 'ACTION_REQUIRED' ? 'Action required' : 'Connection not ready';
  return <Screen><Header title="WhatsApp" back={false} /><View style={s.content}>
    <Icon name={connected ? 'checkmark-circle-outline' : 'logo-whatsapp'} size={48} />
    <Text style={s.title}>{title}</Text>
    <Text style={s.text}>{connected ? `${status?.displayName || 'WhatsApp Business'}${status?.phoneNumber ? ` · ${status.phoneNumber}` : ''}` : 'Your connection status comes from Muenot. If signup just finished, refresh to check again.'}</Text>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {!connected && <Button title="Refresh Status" loading={checking} onPress={() => void check()} />}
    {!connected && <Button title="Try Again" variant="outline" loading={onboarding.isConnecting} onPress={() => void onboarding.start()} />}
    {!!onboarding.error && <Text accessibilityRole="alert" style={s.error}>{onboarding.error}</Text>}
    <Button title="Go to Dashboard" variant={connected ? 'primary' : 'ghost'} onPress={() => router.replace('/home')} />
  </View></Screen>;
}

const s = StyleSheet.create({ content: { padding: 28, gap: 18, alignItems: 'center' }, title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' }, text: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' }, error: { color: colors.danger } });
