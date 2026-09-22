import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/features/queries';
import { bindSessionExpiry, useSession } from '@/features/session';

SplashScreen.preventAutoHideAsync();

/**
 * Restores the session once at launch and sends the user to Login the moment
 * the refresh token stops working, from wherever they happen to be.
 */
function SessionGate() {
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
      router.replace('/login');
    }
  }, [isAuthenticated, isInitializing]);

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
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
