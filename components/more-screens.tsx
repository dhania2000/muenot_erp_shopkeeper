import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Link, router, type Href } from 'expo-router';
import { colors } from '@/constants/theme';
import { Header, Screen, SectionTitle } from './screen';
import { Avatar } from './common';
import { Badge, Button, Card, EmptyState, Icon } from './ui';
import { ErrorState, Loading, UnavailableNote } from './states';
import {
  useAutomations,
  useCampaigns,
  useMarkNotificationsRead,
  useNotifications,
  useSubscription,
  useTeam,
  useTemplates,
  useWhatsAppConnection,
} from '@/features/queries';
import { useWhatsAppOnboarding } from '@/features/whatsapp-onboarding';
import { humanDate } from '@/features/mappers';
import { useSession } from '@/features/session';
import type { Template } from '@/types/domain';

/**
 * The read-only Shopkeeper modules.
 *
 * Templates, campaigns, automations, team and subscription are GET-only on the
 * mobile API. Their write controls are therefore disabled with the reason
 * shown, rather than being wired to something that would fake a result.
 */

/* -------------------------------------------------------- templates ---- */

const TEMPLATE_FILTERS = ['all', 'approved', 'pending', 'rejected'] as const;

function DisconnectedWhatsApp({ title }: { title: string }) {
  const onboarding = useWhatsAppOnboarding();
  const canConnect = useSession((s) => s.user?.role === 'admin' && (s.user?.tenantRole === 'tenant_owner' || s.user?.tenantRole === 'tenant_admin'));
  return <Screen><Header title={title} /><View style={{ padding: 24, gap: 12 }}>
    <EmptyState icon="logo-whatsapp" title="WhatsApp not connected" description="Connect WhatsApp to use this feature with your customers." />
    {canConnect ? <Button title="Connect WhatsApp" loading={onboarding.isConnecting} onPress={() => void onboarding.start()} />
      : <Text style={{ color: colors.muted, textAlign: 'center' }}>Ask your shop owner or admin to connect WhatsApp.</Text>}
    {!!onboarding.error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{onboarding.error}</Text>}
  </View></Screen>;
}

export function Templates() {
  const { templates, isPending, isRefetching, error, refetch } = useTemplates();
  const connection = useWhatsAppConnection();
  const [filter, setFilter] = useState<(typeof TEMPLATE_FILTERS)[number]>('all');
  const data = templates.filter((x) => filter === 'all' || x.status === filter);

  if (!isPending && !error && templates.length === 0 && connection.data && !connection.data.connected) return <DisconnectedWhatsApp title="Templates" />;

  return (
    <Screen scroll={false}>
      <Header title="Templates" />
      <View style={s.filters}>
        {TEMPLATE_FILTERS.map((x) => (
          <Pressable key={x} onPress={() => setFilter(x)} style={[s.filter, filter === x && s.active]}>
            <Text style={[s.filterText, filter === x && s.activeText]}>{x}</Text>
          </Pressable>
        ))}
      </View>
      {isPending ? (
        <Loading label="Loading templates…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          contentContainerStyle={s.pad}
          data={data}
          keyExtractor={(x) => x.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListHeaderComponent={
            <UnavailableNote>
              Template approval is managed by Meta and synced by Muenot ERP. Statuses here are read-only.
            </UnavailableNote>
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No templates"
              description={filter === 'all' ? 'Templates created in Muenot ERP appear here.' : `No ${filter} templates.`}
            />
          }
          renderItem={({ item }) => <TemplateRow template={item} />}
        />
      )}
    </Screen>
  );
}

const templateTone = (status: Template['status']) =>
  status === 'approved' ? 'success' : status === 'pending' ? 'warning' : status === 'rejected' ? 'danger' : 'neutral';

function TemplateRow({ template }: { template: Template }) {
  return (
    <Link href={`/more/templates/${template.id}`} asChild>
      <Pressable>
        <Card style={s.gap}>
          <View style={s.row}>
            <Text style={[s.name, { flex: 1 }]} numberOfLines={1}>
              {template.name}
            </Text>
            {/* The exact status string Meta returned — never a substitute. */}
            <Badge tone={templateTone(template.status)}>{template.rawStatus}</Badge>
          </View>
          <Text style={s.muted} numberOfLines={2}>
            {template.body || 'No body text.'}
          </Text>
          <View style={s.rowStart}>
            {!!template.category && <Badge>{template.category}</Badge>}
            <Badge>{template.language}</Badge>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

/* -------------------------------------------------------- campaigns ---- */

export function Campaigns() {
  const { campaigns, isPending, isRefetching, error, refetch } = useCampaigns();
  const connection = useWhatsAppConnection();

  if (!isPending && !error && campaigns.length === 0 && connection.data && !connection.data.connected) return <DisconnectedWhatsApp title="Campaigns" />;

  return (
    <Screen scroll={false}>
      <Header title="Campaigns" />
      {isPending ? (
        <Loading label="Loading campaigns…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          contentContainerStyle={s.pad}
          data={campaigns}
          keyExtractor={(x) => x.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListHeaderComponent={
            <UnavailableNote>
              Campaigns are created and launched in Muenot ERP, where consent and WhatsApp messaging policy are
              enforced. This screen shows their progress.
            </UnavailableNote>
          }
          ListEmptyComponent={
            <EmptyState icon="megaphone-outline" title="No campaigns" description="Campaigns created in Muenot ERP appear here." />
          }
          renderItem={({ item }) => (
            <Card style={s.gap}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.muted}>{item.audience}</Text>
                </View>
                <Badge
                  tone={
                    item.status === 'completed'
                      ? 'success'
                      : item.status === 'scheduled'
                        ? 'warning'
                        : item.status === 'running'
                          ? 'info'
                          : item.status === 'failed'
                            ? 'danger'
                            : 'neutral'
                  }
                >
                  {item.rawStatus}
                </Badge>
              </View>
              {item.status === 'scheduled' && item.scheduledFor ? (
                <Text style={s.muted}>Scheduled for {item.scheduledFor}</Text>
              ) : (
                <View style={s.stats}>
                  <Stat label="Sent" value={item.sent} />
                  <Stat label="Delivered" value={item.delivered} />
                  <Stat label="Read" value={item.read} />
                  <Stat label="Failed" value={item.failed} />
                </View>
              )}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

/* ------------------------------------------------------- automations --- */

export function Automations() {
  const { automations, isPending, isRefetching, error, refetch } = useAutomations();
  const connection = useWhatsAppConnection();

  if (!isPending && !error && automations.length === 0 && connection.data && !connection.data.connected) return <DisconnectedWhatsApp title="Automations" />;

  return (
    <Screen scroll={false}>
      <Header title="Automations" />
      {isPending ? (
        <Loading label="Loading automations…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          contentContainerStyle={s.pad}
          data={automations}
          keyExtractor={(x) => x.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListHeaderComponent={
            <UnavailableNote>
              Automations are configured in Muenot ERP. The switches here reflect their current state and cannot be
              changed from the app.
            </UnavailableNote>
          }
          ListEmptyComponent={
            <EmptyState icon="git-network-outline" title="No automations" description="Automations set up in Muenot ERP appear here." />
          }
          renderItem={({ item }) => (
            <Card style={s.auto}>
              <View style={s.iconSoft}>
                <Icon name="git-network-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                {/* Built from the backend's trigger/action types only. */}
                <Text style={s.muted}>{item.description}</Text>
              </View>
              <Switch value={item.enabled} disabled trackColor={{ true: colors.primary }} />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------- team ---- */

export function Team() {
  const { team, isPending, isRefetching, error, refetch } = useTeam();
  const currentUserId = useSession((state) => state.user?.id);

  return (
    <Screen scroll={false}>
      <Header title="Team" />
      {isPending ? (
        <Loading label="Loading team…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          contentContainerStyle={s.pad}
          data={team}
          keyExtractor={(x) => x.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListHeaderComponent={
            <UnavailableNote>
              Team members, roles and permissions are managed in Muenot ERP, which enforces them for every request.
            </UnavailableNote>
          }
          ListEmptyComponent={<EmptyState icon="people-outline" title="No team members" description="Nobody else has access to this shop yet." />}
          renderItem={({ item }) => (
            <Card style={s.team}>
              <Avatar name={item.name} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.muted} numberOfLines={1}>
                  {item.email}
                </Text>
                <View style={s.rowStart}>
                  <Badge>{item.role}</Badge>
                  {String(item.id) === String(currentUserId) && <Badge tone="primary">You</Badge>}
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

/* ----------------------------------------------------- subscription ---- */

/** Quotas the shop screen can explain; the rest are ERP-internal. */
const QUOTA_LABELS: Record<string, string> = {
  users: 'Users',
  employees: 'Employees',
  storage_gb: 'Storage (GB)',
  api_calls_per_month: 'API calls / month',
  automations: 'Automations',
  integrations: 'Integrations',
  ai_credits_per_month: 'AI credits / month',
  jobs: 'Background jobs',
};

export function Subscription() {
  const { summary, isPending, isRefetching, error, refetch } = useSubscription();

  return (
    <Screen scroll={false}>
      <Header title="Subscription" />
      {isPending ? (
        <Loading label="Loading subscription…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !summary ? (
        <EmptyState icon="card-outline" title="No subscription" description="This shop has no subscription record yet." />
      ) : (
        <ScrollView
          contentContainerStyle={s.pad}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        >
          <Card style={{ backgroundColor: colors.primarySoft, gap: 6 }}>
            <Text style={s.muted}>Current Plan</Text>
            <Text style={s.big}>{summary.planCode.replace(/\b\w/g, (c) => c.toUpperCase())}</Text>
            <Badge tone={summary.status === 'active' || summary.status === 'trialing' ? 'success' : 'warning'}>
              {summary.status}
            </Badge>
            {summary.currentPeriodEnd && <Text style={s.muted}>Renews on {humanDate(summary.currentPeriodEnd)}</Text>}
            {summary.trialEnd && <Text style={s.muted}>Trial ends {humanDate(summary.trialEnd)}</Text>}
            {summary.seats > 0 && <Text style={s.muted}>{summary.seats} seats</Text>}
          </Card>

          <SectionTitle>Usage & Limits</SectionTitle>
          {summary.quotas.filter((q) => QUOTA_LABELS[q.key]).length === 0 ? (
            <Text style={s.muted}>No usage limits are reported for this plan.</Text>
          ) : (
            summary.quotas
              .filter((q) => QUOTA_LABELS[q.key])
              .map((q) => (
                <Card key={q.key} style={s.gap}>
                  <View style={s.row}>
                    <Text style={s.name}>{QUOTA_LABELS[q.key]}</Text>
                    <Text style={s.muted}>
                      {q.usage} / {q.limit === null ? 'Unlimited' : q.limit}
                    </Text>
                  </View>
                  {q.limit !== null && q.limit > 0 && (
                    <View style={s.bar}>
                      <View style={[s.barFill, { width: `${Math.min(100, (q.usage / q.limit) * 100)}%` }]} />
                    </View>
                  )}
                </Card>
              ))
          )}

          <SectionTitle>Included Features</SectionTitle>
          {summary.featureFlags.filter((f) => f.startsWith('shopkeeper.')).length === 0 ? (
            <Text style={s.muted}>No Shopkeeper features are listed on this plan.</Text>
          ) : (
            <Card style={s.gap}>
              {summary.featureFlags
                .filter((f) => f.startsWith('shopkeeper.'))
                .map((f) => (
                  <Text key={f} style={s.muted}>
                    ✓ {f.replace('shopkeeper.', '').replace(/_/g, ' ')}
                  </Text>
                ))}
            </Card>
          )}

          <UnavailableNote>
            Plan changes and billing are handled in Muenot ERP. The app does not process payments.
          </UnavailableNote>
        </ScrollView>
      )}
    </Screen>
  );
}

/* ---------------------------------------------------- notifications ---- */

const NOTIFICATION_ICON = {
  message: 'chatbubble-outline',
  order: 'bag-outline',
  payment: 'cash-outline',
  campaign: 'megaphone-outline',
  whatsapp: 'logo-whatsapp',
  general: 'notifications-outline',
} as const;

export function Notifications() {
  const { notifications, unread, isPending, isRefetching, error, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const marked = useRef(false);

  // Opening the centre marks everything read once, via PATCH /notifications.
  // Guarded by a ref because the mutation object is new on every render.
  useEffect(() => {
    if (marked.current || unread === 0) return;
    marked.current = true;
    markRead.mutate(undefined);
  }, [unread, markRead]);

  return (
    <Screen scroll={false}>
      <Header title="Notifications" />
      {isPending ? (
        <Loading label="Loading notifications…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(x) => x.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="Nothing new" description="Alerts about messages, orders and payments appear here." />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[s.note, !item.read && s.unreadNote]}
              disabled={!item.destination}
              onPress={() => item.destination && router.push(item.destination as Href)}
            >
              <View style={s.iconSoft}>
                <Icon name={NOTIFICATION_ICON[item.type]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.title}</Text>
                {!!item.description && <Text style={s.muted}>{item.description}</Text>}
                <Text style={s.tiny}>{item.time}</Text>
              </View>
              {!item.read && <View style={s.noteDot} />}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

/* --------------------------------------------------------- reports ----- */

/**
 * The mobile API exposes no reports endpoint. Rather than draw invented bar
 * charts, this shows the figures the dashboard does return and says where the
 * full reports live.
 */
export function Reports() {
  const { summary } = useSubscription();
  return (
    <Screen>
      <Header title="Reports" />
      <View style={s.pad}>
        <UnavailableNote>
          Detailed reporting is not part of the mobile API yet. Today's figures are on the Home screen; full reports are
          available in Muenot ERP.
        </UnavailableNote>
        {summary && (
          <Card style={s.gap}>
            <Text style={s.name}>Plan</Text>
            <Text style={s.muted}>
              {summary.planCode} · {summary.status}
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.stat}>
      <Text style={s.name}>{value.toLocaleString('en-IN')}</Text>
      <Text style={s.tiny}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, gap: 12 },
  filters: { flexDirection: 'row', gap: 7, padding: 16 },
  filter: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12, backgroundColor: '#edf1ef' },
  active: { backgroundColor: colors.primary },
  filterText: { fontSize: 11, fontWeight: '800', color: colors.muted, textTransform: 'capitalize' },
  activeText: { color: '#fff' },
  gap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  tiny: { fontSize: 11, color: colors.muted },
  error: { fontSize: 12, color: colors.danger },
  auto: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconSoft: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  team: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stats: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, backgroundColor: '#f1f4f2', borderRadius: 11, padding: 10, alignItems: 'center' },
  big: { fontSize: 22, fontWeight: '800', color: colors.text },
  bar: { height: 6, borderRadius: 3, backgroundColor: '#e7ece9', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  note: { padding: 14, flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  unreadNote: { backgroundColor: colors.primarySoft },
  noteDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5 },
});
