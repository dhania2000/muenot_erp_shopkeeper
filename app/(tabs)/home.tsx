import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionTitle } from '@/components/screen';
import { Avatar, Metric } from '@/components/common';
import { Badge, Icon } from '@/components/ui';
import { ErrorState, Loading } from '@/components/states';
import { colors } from '@/constants/theme';
import { useDashboard, useNotifications, useShop, useWhatsAppConnection } from '@/features/queries';
import { useWhatsAppOnboarding } from '@/features/whatsapp-onboarding';
import { isEntitled, useSession } from '@/features/session';
import { humanDate, humanShortTime } from '@/features/mappers';
import { ApiError } from '@/services/api/errors';
import type { DashboardConversation, DashboardOrder } from '@/types/api';

/** /dashboard answers 200 with the ERP personal dashboard for a non-shop tenant. */
const NOT_A_SHOP = new ApiError({
  kind: 'forbidden',
  status: 200,
  message: 'This account is not a Shopkeeper tenant, so the shop dashboard is not available.',
});

/**
 * Home is fed entirely by GET /dashboard. The recent lists come from that same
 * payload rather than from the inbox/orders endpoints, so opening the app is
 * one request.
 */
export default function Home() {
  const dashboard = useDashboard();
  const { shop } = useShop();
  const notifications = useNotifications();
  const canSeeWhatsApp = useSession((s) => isEntitled(s, 'whatsapp'));
  const connection = useWhatsAppConnection({ enabled: canSeeWhatsApp });
  const onboarding = useWhatsAppOnboarding();
  const user = useSession((s) => s.user);
  const canConnect = user?.role === 'admin' && (user.tenantRole === 'tenant_owner' || user.tenantRole === 'tenant_admin');
  const canSeeOrders = useSession((s) => isEntitled(s, 'orders'));
  const canSeeInbox = useSession((s) => isEntitled(s, 'inbox'));
  const canSeeProducts = useSession((s) => isEntitled(s, 'products'));
  const canSeeContacts = useSession((s) => isEntitled(s, 'contacts'));

  const refresh = useCallback(() => {
    dashboard.refetch();
    notifications.refetch();
    if (canSeeWhatsApp) connection.refetch();
  }, [dashboard, notifications, connection, canSeeWhatsApp]);

  const metrics = dashboard.metrics;
  const firstName = (shop.owner || user?.name || '').split(' ')[0];
  const wa = connection.data;
  const connected = wa?.connected === true && wa.status === 'CONNECTED';
  const waLabel = onboarding.isConnecting ? 'Connecting…' : connection.isPending ? 'Checking…' : connection.isError ? 'Connection failed'
    : connected ? 'Connected ✓' : wa?.status === 'CONNECTING' ? 'Connecting…'
    : wa?.status === 'ACTION_REQUIRED' ? 'Action required' : 'Not connected';

  const quickActions = [
    canSeeInbox && ['/inbox', 'Open Inbox', 'chatbubble-outline'],
    canSeeOrders && ['/orders/new', 'New Order', 'bag-outline'],
    canSeeContacts && ['/customers/new', 'Add Customer', 'person-add-outline'],
    canSeeProducts && ['/more/products/new', 'Add Product', 'add-circle-outline'],
  ].filter(Boolean) as string[][];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={dashboard.isRefetching} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <View style={s.header}>
          <View style={s.shop}>
            <Avatar name={shop.name} />
            <View>
              <Text style={s.shopName} numberOfLines={1}>
                {shop.name}
              </Text>
              <Text style={s.muted}>{shop.category || '—'}</Text>
            </View>
          </View>
          <Link href="/notifications" asChild>
            <Pressable style={s.bell}>
              <Icon name="notifications-outline" />
              {notifications.unread > 0 && <View style={s.alert} />}
            </Pressable>
          </Link>
        </View>

        <View style={s.intro}>
          <Text style={s.h1}>{firstName ? `Good morning, ${firstName}` : 'Good morning'}</Text>
          <Text style={s.muted}>Here's what's happening in your shop today.</Text>
        </View>

        {canSeeWhatsApp && <Pressable style={s.wa} accessibilityRole="button" accessibilityLabel={`WhatsApp Business, ${waLabel}`} disabled={onboarding.isConnecting} onPress={() => connection.isError ? void connection.refetch() : connected ? router.push('/more/settings/whatsapp') : canConnect ? void onboarding.start() : router.push('/more/settings/whatsapp')}>
            <View style={s.waIcon}>
              <Icon name="logo-whatsapp" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.shopName}>WhatsApp Business</Text>
              <Text style={s.muted}>{connected ? (wa.phoneNumber || wa.displayName || 'Connected') : connection.isError ? 'Pull down to retry' : 'Connect your WhatsApp Business account to start messaging customers.'}</Text>
              {!connected && canConnect && !connection.isPending && <Text style={s.waCta}>{connection.isError ? 'Try Again' : onboarding.isConnecting ? 'Connecting…' : wa?.status === 'ACTION_REQUIRED' ? 'Reconnect' : 'Connect WhatsApp'}</Text>}
            </View>
            <Badge tone={connected ? 'success' : connection.isError ? 'danger' : wa?.status === 'CONNECTING' ? 'info' : 'warning'}>{waLabel}</Badge>
          </Pressable>}
        {canSeeWhatsApp && !!onboarding.error && <Text accessibilityRole="alert" style={s.waError}>{onboarding.error}</Text>}

        {dashboard.isPending ? (
          <Loading label="Loading your shop…" />
        ) : dashboard.error ? (
          <ErrorState error={dashboard.error} onRetry={refresh} />
        ) : dashboard.isNonShopTenant ? (
          <View style={s.block}>
            <ErrorState
              compact
              error={NOT_A_SHOP}
            />
          </View>
        ) : (
          <>
            <View style={s.metrics}>
              <Metric label="Today's Messages" value={`${metrics?.todaysMessages ?? 0}`} icon="chatbubble" tone={colors.info} />
              <Metric label="Unread Chats" value={`${metrics?.unreadChats ?? 0}`} icon="chatbubbles" tone={colors.warning} />
              <Metric label="Today's Orders" value={`${metrics?.todaysOrders ?? 0}`} icon="bag" />
              <Metric label="Pending Orders" value={`${metrics?.pendingOrders ?? 0}`} icon="hourglass" tone={colors.warning} />
              <Metric
                label="Today's Sales"
                value={`₹${(metrics?.todaysSales ?? 0).toLocaleString('en-IN')}`}
                icon="cash"
                tone={colors.success}
              />
              <Metric label="Customers" value={`${metrics?.customerCount ?? 0}`} icon="people" tone={colors.info} />
            </View>

            {quickActions.length > 0 && (
              <View style={s.block}>
                <SectionTitle>Quick Actions</SectionTitle>
                <View style={s.actions}>
                  {quickActions.map(([href, label, icon]) => (
                    <Link href={href as any} key={label} asChild>
                      <Pressable style={s.action}>
                        <View style={s.actionIcon}>
                          <Icon name={icon as any} />
                        </View>
                        <Text style={s.actionText}>{label}</Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </View>
            )}

            {canSeeInbox && (
              <View style={s.block}>
                <View style={s.titleRow}>
                  <SectionTitle>Recent Messages</SectionTitle>
                  <Link href="/inbox">
                    <Text style={s.link}>View all</Text>
                  </Link>
                </View>
                {dashboard.recentConversations.length === 0 ? (
                  <Text style={s.emptyLine}>No conversations yet.</Text>
                ) : (
                  dashboard.recentConversations.slice(0, 3).map((c) => <RecentConversation key={c.id} conversation={c} />)
                )}
              </View>
            )}

            {canSeeOrders && (
              <View style={s.block}>
                <View style={s.titleRow}>
                  <SectionTitle>Recent Orders</SectionTitle>
                  <Link href="/orders">
                    <Text style={s.link}>View all</Text>
                  </Link>
                </View>
                {dashboard.recentOrders.length === 0 ? (
                  <Text style={s.emptyLine}>No orders yet.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {dashboard.recentOrders.slice(0, 3).map((o) => (
                      <RecentOrder key={o.id} order={o} />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** The dashboard's trimmed conversation row — not the full inbox shape. */
function RecentConversation({ conversation }: { conversation: DashboardConversation }) {
  const name = conversation.contactName?.trim() || conversation.phone || 'Unknown';
  return (
    <Link href={`/inbox/${conversation.id}`} asChild>
      <Pressable style={s.list}>
        <Avatar name={name} />
        <View style={s.flex}>
          <View style={s.row}>
            <Text style={s.medium} numberOfLines={1}>
              {name}
            </Text>
            <Text style={s.tiny}>{humanShortTime(conversation.lastMessageAt)}</Text>
          </View>
          <Text numberOfLines={1} style={[s.muted, conversation.unreadCount > 0 && s.medium]}>
            {conversation.preview ?? ''}
          </Text>
        </View>
        {conversation.unreadCount > 0 && (
          <View style={s.unread}>
            <Text style={s.unreadText}>{conversation.unreadCount}</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const orderTone = (status: string) =>
  status === 'completed' ? 'success' : status === 'processing' ? 'warning' : status === 'cancelled' ? 'danger' : 'info';

function RecentOrder({ order }: { order: DashboardOrder }) {
  return (
    <Link href={`/orders/${order.id}`} asChild>
      <Pressable style={s.card}>
        <View style={s.row}>
          <Text style={s.bold}>{order.orderNumber}</Text>
          <Badge tone={orderTone(order.status) as any}>{order.status}</Badge>
        </View>
        <Text style={s.muted}>{order.customerName ?? 'Walk-in customer'}</Text>
        <View style={s.row}>
          <Text style={s.small}>{humanDate(order.createdAt)}</Text>
          <Text style={s.bold}>₹{Number(order.total).toLocaleString('en-IN')}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  shop: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  shopName: { fontSize: 14, fontWeight: '800', color: colors.text },
  muted: { fontSize: 12, color: colors.muted },
  bell: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  alert: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, right: 7, top: 8 },
  intro: { paddingHorizontal: 16, paddingBottom: 18, gap: 3 },
  h1: { fontSize: 21, fontWeight: '800', color: colors.text },
  wa: { marginHorizontal: 16, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 10 },
  waIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  waCta: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 6 },
  waError: { color: colors.danger, fontSize: 12, marginHorizontal: 18, marginTop: 6 },
  metrics: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  block: { paddingHorizontal: 16, paddingBottom: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontSize: 12, color: colors.primary, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { width: '24%', alignItems: 'center', gap: 5 },
  actionIcon: { width: 45, height: 45, borderRadius: 23, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 10, textAlign: 'center', color: colors.text, fontWeight: '700' },
  emptyLine: { fontSize: 13, color: colors.muted, paddingVertical: 8 },
  list: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  flex: { flex: 1, minWidth: 0, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  medium: { fontSize: 14, fontWeight: '700', color: colors.text },
  bold: { fontSize: 14, fontWeight: '800', color: colors.text },
  small: { fontSize: 12, color: colors.muted },
  tiny: { fontSize: 11, color: colors.muted },
  unread: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 14, gap: 9 },
});
