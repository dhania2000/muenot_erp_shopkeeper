import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/features/session';
import { colors } from '@/constants/theme';

/**
 * Launch route. Waits for the session restore started in the root layout, then
 * routes: a restored session goes straight to Home, anything else to Welcome.
 */
export default function Splash() {
  const isInitializing = useSession((s) => s.isInitializing);
  const isAuthenticated = useSession((s) => s.isAuthenticated);

  useEffect(() => {
    if (isInitializing) return;
    router.replace(isAuthenticated ? '/home' : '/welcome');
  }, [isInitializing, isAuthenticated]);

  return (
    <View style={s.root}>
      <View style={s.center}>
        <View style={s.logo}>
          <Image source={require('@/assets/images/logo-mark.png')} style={s.image} />
        </View>
        <Text style={s.brand}>Muenot</Text>
        <Text style={s.sub}>Shopkeeper</Text>
      </View>
      <ActivityIndicator color="#fff" />
      <Text style={s.setup}>Setting things up...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 7, flex: 1, justifyContent: 'center' },
  logo: { width: 78, height: 78, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' },
  image: { width: 56, height: 56, borderRadius: 18 },
  brand: { fontSize: 25, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 14, color: '#d8eee5' },
  setup: { color: '#d8eee5', fontSize: 12, marginTop: 12, marginBottom: 48 },
});
