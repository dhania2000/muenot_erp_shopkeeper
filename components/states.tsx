import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { Button, Icon } from './ui';
import { isApiError, type ApiError, type ApiErrorKind } from '@/services/api/errors';

/**
 * The shared loading / failure surfaces. Every screen that reads from the API
 * uses these so an offline handset, an expired plan and a 500 never look the
 * same to a shopkeeper.
 */

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

const ICONS: Partial<Record<ApiErrorKind, any>> = {
  offline: 'cloud-offline-outline',
  timeout: 'time-outline',
  forbidden: 'lock-closed-outline',
  notFound: 'help-circle-outline',
  server: 'server-outline',
  rateLimited: 'hourglass-outline',
  unauthorized: 'log-in-outline',
};

const TITLES: Partial<Record<ApiErrorKind, string>> = {
  offline: 'No internet connection',
  timeout: 'That took too long',
  forbidden: 'Not available on your plan',
  notFound: 'Not found',
  server: 'Server unavailable',
  rateLimited: 'Too many requests',
  unauthorized: 'Session expired',
};

export function ErrorState({
  error,
  onRetry,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const apiError = isApiError(error) ? (error as ApiError) : null;
  const kind = apiError?.kind ?? 'unknown';
  const title = TITLES[kind] ?? 'Something went wrong';
  const message = apiError?.message ?? 'Please try again.';
  // Retrying a plan refusal or an expired session cannot help, so the button
  // is only offered where it might.
  const canRetry = !!onRetry && kind !== 'forbidden' && kind !== 'unauthorized';

  return (
    <View style={[s.center, compact && s.compact]}>
      <View style={s.icon}>
        <Icon name={ICONS[kind] ?? 'alert-circle-outline'} size={compact ? 22 : 26} color={colors.muted} />
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.message}>{message}</Text>
      {canRetry && (
        <View style={s.action}>
          <Button title="Try again" variant="outline" onPress={onRetry} />
        </View>
      )}
    </View>
  );
}

/**
 * Renders children once data has arrived, and the right state before that.
 * `isEmpty` + `empty` keep an empty list from showing as a blank screen.
 */
export function QueryBoundary({
  isPending,
  error,
  onRetry,
  isEmpty,
  empty,
  loadingLabel,
  children,
}: {
  isPending: boolean;
  error?: unknown;
  onRetry?: () => void;
  isEmpty?: boolean;
  empty?: ReactNode;
  loadingLabel?: string;
  children: ReactNode;
}) {
  if (isPending) return <Loading label={loadingLabel} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty && empty) return <>{empty}</>;
  return <>{children}</>;
}

/** Inline note for an action the backend does not expose. */
export function UnavailableNote({ children }: { children: ReactNode }) {
  return (
    <View style={s.note}>
      <Icon name="information-circle-outline" size={17} color={colors.muted} />
      <Text style={s.noteText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8, flexGrow: 1 },
  compact: { padding: 20, flexGrow: 0 },
  icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f0f3f1', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center' },
  message: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, maxWidth: 300 },
  muted: { fontSize: 13, color: colors.muted },
  action: { marginTop: 6, alignSelf: 'stretch', paddingHorizontal: 24 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: '#f2f5f3' },
  noteText: { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 17 },
});
