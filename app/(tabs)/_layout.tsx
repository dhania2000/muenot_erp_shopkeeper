import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { isEntitled, useSession } from '@/features/session';

const tab = (label: string, icon: any) => ({
  title: label,
  tabBarIcon: ({ color, focused }: any) => <Ionicons name={focused ? icon : `${icon}-outline`} size={21} color={color} />,
});

/**
 * Tabs for modules the plan does not include are hidden rather than shown as
 * dead ends. Hiding is cosmetic: the routes still exist and the backend is
 * still the authority on every request they make.
 */
export default function TabsLayout() {
  const session = useSession();
  const hide = (allowed: boolean) => (allowed ? {} : { href: null as never });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="home" options={tab('Home', 'home')} />
      <Tabs.Screen name="inbox" options={{ ...tab('Inbox', 'chatbubbles'), ...hide(isEntitled(session, 'inbox')) }} />
      <Tabs.Screen name="orders" options={{ ...tab('Orders', 'bag'), ...hide(isEntitled(session, 'orders')) }} />
      <Tabs.Screen name="customers" options={{ ...tab('Customers', 'people'), ...hide(isEntitled(session, 'contacts')) }} />
      <Tabs.Screen name="more" options={tab('More', 'menu')} />
    </Tabs>
  );
}
