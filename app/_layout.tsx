import { useEffect, useRef, useState } from 'react';
import { Stack, router, usePathname, useRootNavigationState, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/features/queries';
import { bindSessionExpiry, useSession } from '@/features/session';
import { notificationDestination } from '@/services/notification-routing';
import { invalidateForPush, registerCurrentDevice, subscribeToPush, subscribeToTokenChanges } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

/**
 * Restores the session once at launch and sends the user to Login the moment
 * the refresh token stops working, from wherever they happen to be.
 */
function SessionGate() {
  const queryClient = useQueryClient();
  const initialize = useSession((s) => s.initialize);
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  const isInitializing = useSession((s) => s.isInitializing);
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    initialize();
    return bindSessionExpiry();
  }, [initialize]);

  useEffect(() => {
    if (isInitializing) return;
    if (isAuthenticated) {
      wasAuthenticated.current = true;
      return;
    }
    // Only redirect on a session that was live and then ended — a cold start
    // without a session is handled by the splash route.
    if (wasAuthenticated.current) {
      wasAuthenticated.current = false;
      queryClient.clear();
      router.replace('/login');
    }
  }, [isAuthenticated, isInitializing, queryClient]);

  return null;
}

function NotificationCoordinator() {
  const queryClient = useQueryClient();
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  const isInitializing = useSession((s) => s.isInitializing);
  const navigation = useRootNavigationState();
  const pathname = usePathname();
  const [pending, setPending] = useState<{ id: string; route: string } | null>(null);
  const lastHandledId = useRef<string | null>(null);
  const wasAuthenticated = useRef(false);

  useEffect(() => subscribeToPush(queryClient, (data, id) => {
    if (lastHandledId.current === id) return;
    lastHandledId.current = id;
    setPending({ id, route: notificationDestination(data) });
  }), [queryClient]);

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
    } else if (!isInitializing && wasAuthenticated.current) {
      wasAuthenticated.current = false;
      lastHandledId.current = null;
      setPending(null);
    }
  }, [isAuthenticated, isInitializing]);

  useEffect(() => {
    if (isInitializing || !isAuthenticated) return;
    void registerCurrentDevice();
    const unsubscribeToken = subscribeToTokenChanges();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        invalidateForPush(queryClient, {});
        void registerCurrentDevice();
      }
    });
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      if (state.isConnected === true) void registerCurrentDevice();
    });
    return () => {
      unsubscribeToken();
      unsubscribeNetwork();
      appState.remove();
    };
  }, [isAuthenticated, isInitializing, queryClient]);

  useEffect(() => {
    // The root stack and restored bearer session must exist before routing.
    // On a cold launch, let the existing splash route finish its redirect.
    if (!pending || !isAuthenticated || isInitializing || !navigation?.key || pathname === '/') return;
    router.push(pending.route as Href);
    setPending(null);
  }, [pending, isAuthenticated, isInitializing, navigation?.key, pathname]);

  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SessionGate />
        <NotificationCoordinator />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
