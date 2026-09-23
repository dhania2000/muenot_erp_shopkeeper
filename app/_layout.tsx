import { useEffect, useRef, useState } from 'react';
import { Stack, router, usePathname, useRootNavigationState, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/features/queries';
import { canOpenBusiness } from '@/features/account-routing';
import { bindSessionExpiry, useSession } from '@/features/session';
import { notificationDestination } from '@/services/notification-routing';
import { callbackOutcome } from '@/services/whatsapp-onboarding';
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
  const registrationStatus = useSession((s) => s.registrationStatus);
  const refreshRegistrationStatus = useSession((s) => s.refreshRegistrationStatus);
  const pathname = usePathname();
  const navigation = useRootNavigationState();
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
      router.replace(registrationStatus && registrationStatus.status !== 'APPROVED' ? '/registration/status' : '/login');
    }
  }, [isAuthenticated, isInitializing, registrationStatus, queryClient]);

  useEffect(() => {
    if (isInitializing || !navigation?.key || pathname === '/') return;
    const publicPath = pathname === '/welcome' || pathname === '/login' || pathname === '/signup'
      || pathname === '/registration/status' || pathname === '/login/forgot-password';
    if (!isAuthenticated && !publicPath) router.replace(registrationStatus ? '/registration/status' : '/login');
    else if (registrationStatus && registrationStatus.status !== 'APPROVED' && pathname !== '/registration/status') router.replace('/registration/status');
  }, [isAuthenticated, isInitializing, registrationStatus, navigation?.key, pathname]);

  useEffect(() => {
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active' && registrationStatus) void refreshRegistrationStatus();
    });
    return () => appState.remove();
  }, [registrationStatus, refreshRegistrationStatus]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const outcome = callbackOutcome(url);
      if (outcome) router.replace(`/whatsapp/return?result=${outcome}`);
    });
    return () => subscription.remove();
  }, []);

  const publicPath = pathname === '/' || pathname === '/welcome' || pathname === '/login' || pathname === '/signup'
    || pathname === '/registration/status' || pathname === '/login/forgot-password';
  const blocked = isInitializing || (!publicPath && !canOpenBusiness(isAuthenticated, registrationStatus?.status ?? null));
  return blocked ? <View pointerEvents="auto" style={gateStyles.blocker} /> : null;
}

const gateStyles = StyleSheet.create({ blocker: { ...StyleSheet.absoluteFill, zIndex: 100, backgroundColor: '#00583d' } });

function NotificationCoordinator() {
  const queryClient = useQueryClient();
  const refreshRegistrationStatus = useSession((s) => s.refreshRegistrationStatus);
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
    if (data.type === 'SHOPKEEPER_APPROVED' || data.type === 'SHOPKEEPER_REJECTED' || data.type === 'SHOPKEEPER_SUSPENDED') {
      void refreshRegistrationStatus();
    }
    setPending({ id, route: notificationDestination(data) });
  }), [queryClient, refreshRegistrationStatus]);

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
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        <SessionGate />
        <NotificationCoordinator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
