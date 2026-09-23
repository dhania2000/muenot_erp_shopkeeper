import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { Header, Screen, SectionTitle } from './screen';
import { Avatar, MenuItem } from './common';
import { Badge, Button, Card, Icon, Input } from './ui';
import { ErrorState, Loading, UnavailableNote } from './states';
import { useShop, useUpdateShopProfile, useWhatsApp, useWhatsAppConnection } from '@/features/queries';
import { useWhatsAppOnboarding } from '@/features/whatsapp-onboarding';
import { isEntitled, useIsTenantAdmin, useSession } from '@/features/session';
import { businessHoursToApi } from '@/features/mappers';
import { errorMessage, isApiError } from '@/services/api/errors';
import type { BusinessHoursDay } from '@/types/domain';

/* --------------------------------------------------------- settings ---- */

export function Settings() {
  const { shop } = useShop();
  const logout = useSession((state) => state.logout);
  const user = useSession((state) => state.user);
  const canTeam = useSession((s) => isEntitled(s, 'team'));
  const canSubscription = useSession((s) => isEntitled(s, 'subscription'));
  const canWhatsApp = useSession((s) => isEntitled(s, 'whatsapp'));
  const [loggingOut, setLoggingOut] = useState(false);

  const groups: [string, [string, string, string][]][] = [
    [
      'Shop',
      [
        ['/more/settings/shop-profile', 'Shop Profile', 'storefront-outline'],
        ['/more/settings/business-hours', 'Business Hours', 'time-outline'],
        ...(canWhatsApp ? ([['/more/settings/whatsapp', 'WhatsApp', 'logo-whatsapp']] as [string, string, string][]) : []),
      ],
    ],
    [
      'Preferences',
      [
        ['/more/settings/notifications', 'Notifications', 'notifications-outline'],
        ...(canTeam ? ([['/more/team', 'Team', 'people-outline']] as [string, string, string][]) : []),
        ...(canSubscription ? ([['/more/subscription', 'Subscription', 'card-outline']] as [string, string, string][]) : []),
      ],
    ],
    [
      'Account',
      [
        ['/more/settings/account', 'Account', 'person-circle-outline'],
        ['/more/settings/help', 'Help & Support', 'help-circle-outline'],
        ['/more/settings/legal/privacy', 'Privacy', 'shield-checkmark-outline'],
        ['/more/settings/legal/terms', 'Terms', 'document-text-outline'],
      ],
    ],
  ];

  const confirmLogout = () =>
    Alert.alert('Log out', 'You will need to log in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          // Revokes the device session server-side, then clears SecureStore.
          await logout();
          setLoggingOut(false);
          router.replace('/login');
        },
      },
    ]);

  return (
    <Screen>
      <Header title="Settings" />
      <View style={s.profile}>
        <Avatar name={shop.name} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{shop.name}</Text>
          <Text style={s.muted} numberOfLines={1}>
            {shop.owner || user?.email || ''}
          </Text>
        </View>
      </View>
      {groups.map(([title, items]) => (
        <View key={title} style={s.section}>
          <SectionTitle>{title}</SectionTitle>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {items.map((x) => (
              <MenuItem key={x[0]} href={x[0]} label={x[1]} icon={x[2]} />
            ))}
          </Card>
        </View>
      ))}
      <View style={s.pad}>
        <Button title="Logout" variant="danger" icon="log-out-outline" loading={loggingOut} onPress={confirmLogout} />
      </View>
    </Screen>
  );
}

/* ----------------------------------------------------- shop profile ---- */

/**
 * PATCH /tenant. The backend accepts tenant owners and admins only and answers
 * 403 otherwise, so the form is read-only for everyone else.
 */
export function ShopProfile() {
  const { shop, profile, isPending, isError, error, refetch } = useShop();
  const update = useUpdateShopProfile();
  const canEdit = useIsTenantAdmin();

  if (isPending) return <Shell title="Shop Profile"><Loading /></Shell>;
  if (isError) return <Shell title="Shop Profile"><ErrorState error={error} onRetry={refetch} /></Shell>;

  return <ShopProfileFields key={profile?.tenantId ?? 'new'} shop={shop} canEdit={canEdit} update={update} />;
}

function ShopProfileFields({
  shop,
  canEdit,
  update,
}: {
  shop: ReturnType<typeof useShop>['shop'];
  canEdit: boolean;
  update: ReturnType<typeof useUpdateShopProfile>;
}) {
  const [form, setForm] = useState({
    shopName: shop.name,
    ownerName: shop.owner,
    businessCategory: shop.category,
    email: shop.email ?? '',
    phone: shop.phone ?? '',
    address: shop.address ?? '',
    city: shop.city,
    state: shop.state,
    pinCode: shop.pinCode ?? '',
    country: shop.country ?? '',
    gstin: shop.gstin ?? '',
    website: shop.website ?? '',
    timezone: shop.timezone ?? '',
    currency: shop.currency ?? '',
  });
  const set = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const fieldError = (name: string) => (isApiError(update.error) ? update.error.fields?.[name] : undefined);
  const banner = isApiError(update.error) && !update.error.fields ? update.error.message : null;

  const submit = () =>
    update.mutate(form, {
      onSuccess: () => router.back(),
      onError: (e) => {
        if (isApiError(e) && e.fields) return;
        Alert.alert('Not saved', errorMessage(e));
      },
    });

  return (
    <Screen keyboard>
      <Header title="Shop Profile" />
      <View style={s.form}>
        {!canEdit && <UnavailableNote>Only the shop owner or an admin can change these details.</UnavailableNote>}
        {banner && <Text style={s.error}>{banner}</Text>}
        <Input label="Shop Name" value={form.shopName} onChangeText={set('shopName')} editable={canEdit} error={fieldError('shopName')} />
        <Input label="Owner Name" value={form.ownerName} onChangeText={set('ownerName')} editable={canEdit} error={fieldError('ownerName')} />
        <Input label="Business Category" value={form.businessCategory} onChangeText={set('businessCategory')} editable={canEdit} />
        <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" editable={canEdit} error={fieldError('email')} />
        <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" editable={canEdit} />
        <Input label="Address" multiline value={form.address} onChangeText={set('address')} editable={canEdit} />
        <View style={s.pair}>
          <View style={s.half}>
            <Input label="City" value={form.city} onChangeText={set('city')} editable={canEdit} />
          </View>
          <View style={s.half}>
            <Input label="State" value={form.state} onChangeText={set('state')} editable={canEdit} />
          </View>
        </View>
        <View style={s.pair}>
          <View style={s.half}>
            <Input label="PIN Code" value={form.pinCode} onChangeText={set('pinCode')} keyboardType="numeric" editable={canEdit} />
          </View>
          <View style={s.half}>
            <Input label="Country" value={form.country} onChangeText={set('country')} editable={canEdit} />
          </View>
        </View>
        <Input label="GSTIN" value={form.gstin} onChangeText={set('gstin')} autoCapitalize="characters" editable={canEdit} error={fieldError('gstin')} />
        <Input label="Website" value={form.website} onChangeText={set('website')} autoCapitalize="none" keyboardType="url" editable={canEdit} />
        <View style={s.pair}>
          <View style={s.half}>
            <Input label="Currency" value={form.currency} onChangeText={set('currency')} autoCapitalize="characters" editable={canEdit} placeholder="INR" />
          </View>
          <View style={s.half}>
            <Input label="Timezone" value={form.timezone} onChangeText={set('timezone')} autoCapitalize="none" editable={canEdit} placeholder="Asia/Kolkata" />
          </View>
        </View>
        {canEdit && <Button title="Save Changes" loading={update.isPending} onPress={submit} />}
      </View>
    </Screen>
  );
}

/* --------------------------------------------------- business hours ---- */

export function BusinessHours() {
  const { shop, isPending, isError, error, refetch } = useShop();
  const update = useUpdateShopProfile();
  const canEdit = useIsTenantAdmin();
  const [hours, setHours] = useState<BusinessHoursDay[]>(shop.businessHours);

  // Seed the local copy once the stored hours arrive.
  useEffect(() => {
    setHours(shop.businessHours);
  }, [shop.businessHours]);

  if (isPending) return <Shell title="Business Hours"><Loading /></Shell>;
  if (isError) return <Shell title="Business Hours"><ErrorState error={error} onRetry={refetch} /></Shell>;

  const save = () =>
    update.mutate(
      { businessHours: businessHoursToApi(hours) },
      { onSuccess: () => router.back(), onError: (e) => Alert.alert('Not saved', errorMessage(e)) },
    );

  return (
    <Screen>
      <Header title="Business Hours" />
      <View style={s.pad}>
        {!canEdit && <UnavailableNote>Only the shop owner or an admin can change business hours.</UnavailableNote>}
        {hours.map((h, i) => (
          <Card key={h.day} style={s.hoursRow}>
            <Switch
              value={h.enabled}
              disabled={!canEdit}
              onValueChange={(v) => setHours(hours.map((x, j) => (j === i ? { ...x, enabled: v } : x)))}
              trackColor={{ true: colors.primary }}
            />
            <Text style={[s.name, { width: 80 }]}>{h.day}</Text>
            {h.enabled ? (
              <View style={s.hoursInputs}>
                <Input value={h.open} editable={canEdit} placeholder="10:00 AM" onChangeText={(v) => setHours(hours.map((x, j) => (j === i ? { ...x, open: v } : x)))} />
                <Text style={s.muted}>to</Text>
                <Input value={h.close} editable={canEdit} placeholder="9:00 PM" onChangeText={(v) => setHours(hours.map((x, j) => (j === i ? { ...x, close: v } : x)))} />
              </View>
            ) : (
              <Text style={[s.muted, { flex: 1 }]}>Closed</Text>
            )}
          </Card>
        ))}
        {canEdit && <Button title="Save Changes" loading={update.isPending} onPress={save} />}
      </View>
    </Screen>
  );
}

/* --------------------------------------------------------- whatsapp ---- */

/**
 * Real connection health from GET /whatsapp. The backend sanitises this
 * payload — no Meta access token, app secret, WABA id or encrypted credential
 * is ever sent to the handset, and none is rendered here.
 */
export function WhatsAppSettings() {
  const { status, health, caps, isPending, isError, error, refetch } = useWhatsApp();
  const connection = useWhatsAppConnection();
  const onboarding = useWhatsAppOnboarding();
  const canConnect = useSession((s) => s.user?.role === 'admin' && (s.user?.tenantRole === 'tenant_owner' || s.user?.tenantRole === 'tenant_admin'));

  if (isPending) return <Shell title="WhatsApp"><Loading label="Checking connection…" /></Shell>;
  if (isError) return <Shell title="WhatsApp"><ErrorState error={error} onRetry={refetch} /></Shell>;

  const ready = connection.data?.connected === true && connection.data.status === 'CONNECTED';

  return (
    <Screen>
      <Header title="WhatsApp" />
      <View style={s.center}>
        <View style={s.waIcon}>
          <Icon name={ready ? 'checkmark-circle' : 'logo-whatsapp'} size={35} color={ready ? colors.success : colors.primary} />
        </View>
        <Badge tone={ready ? 'success' : 'warning'}>{ready ? 'Connected' : connection.data?.status === 'ACTION_REQUIRED' ? 'Action required' : connection.data?.status === 'CONNECTING' ? 'Connecting' : 'Not connected'}</Badge>
        <Text style={s.centerText}>
          {ready
            ? 'Your WhatsApp Business number is connected and ready to send and receive messages.'
            : 'Connect your WhatsApp Business account to start messaging customers.'}
        </Text>
      </View>
      <View style={s.pad}>
        <Card style={s.gap}>
          <Row label="Business Name" value={ready ? connection.data?.displayName ?? '—' : '—'} />
          <Row label="Phone Number" value={ready ? connection.data?.phoneNumber ?? '—' : 'Not connected'} />
          <Row label="Quality Rating" value={health?.phone?.qualityRating ?? '—'} />
          <Row label="Templates Approved" value={health ? `${health.templates.approved} of ${health.templates.total}` : '—'} />
          <Row label="Messages in last 24h" value={String(health?.webhook.eventsLast24h ?? 0)} />
        </Card>

        {!!health?.checks?.length && (
          <>
            <SectionTitle>Connection Checks</SectionTitle>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {health.checks.map((check) => (
                <View key={check.id} style={s.check}>
                  <Icon
                    name={check.status === 'ok' ? 'checkmark-circle' : check.status === 'warn' ? 'alert-circle' : 'close-circle'}
                    size={18}
                    color={check.status === 'ok' ? colors.success : check.status === 'warn' ? colors.warning : colors.danger}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{check.label}</Text>
                    {!!check.detail && <Text style={s.muted}>{check.detail}</Text>}
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {health?.webhook.lastError && (
          <Card style={s.gap}>
            <Text style={s.name}>Last webhook error</Text>
            <Text style={s.error}>{health.webhook.lastError}</Text>
          </Card>
        )}

        {caps && !caps.canSend && <UnavailableNote>Your account cannot send WhatsApp messages. Ask an admin to grant the permission.</UnavailableNote>}

        {!ready && canConnect && <Button title={connection.data?.status === 'ACTION_REQUIRED' ? 'Reconnect WhatsApp' : 'Connect WhatsApp'} loading={onboarding.isConnecting} onPress={() => void onboarding.start()} />}
        {!ready && !canConnect && <UnavailableNote>Ask your shop owner or admin to connect WhatsApp.</UnavailableNote>}
        {!!onboarding.error && <Text accessibilityRole="alert" style={s.error}>{onboarding.error}</Text>}
      </View>
    </Screen>
  );
}

/* --------------------------------------- notification preferences ------ */

const PREF_LABELS: { key: string; label: string; description: string }[] = [
  { key: 'newMessage', label: 'New WhatsApp Messages', description: 'Get notified for every new customer message' },
  { key: 'newOrder', label: 'New Orders', description: 'Get notified when a new order is placed' },
  { key: 'payment', label: 'Payments', description: 'Get notified when payments are received' },
  { key: 'campaign', label: 'Campaign Updates', description: 'Get notified when campaigns finish sending' },
  { key: 'dailySummary', label: 'Daily Summary', description: 'A daily roundup of your shop activity' },
];

/** Stored on the tenant profile as free-form `notificationPreferences`. */
export function NotificationSettings() {
  const { shop, isPending, isError, error, refetch } = useShop();
  const update = useUpdateShopProfile();
  const canEdit = useIsTenantAdmin();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(shop.notificationPreferences);

  useEffect(() => {
    setPrefs(shop.notificationPreferences);
  }, [shop.notificationPreferences]);

  if (isPending) return <Shell title="Notifications"><Loading /></Shell>;
  if (isError) return <Shell title="Notifications"><ErrorState error={error} onRetry={refetch} /></Shell>;

  const save = (next: Record<string, boolean>) => {
    setPrefs(next);
    update.mutate({ notificationPreferences: next }, { onError: (e) => Alert.alert('Not saved', errorMessage(e)) });
  };

  return (
    <Screen>
      <Header title="Notifications" />
      <View style={s.pad}>
        {!canEdit && <UnavailableNote>Only the shop owner or an admin can change these preferences.</UnavailableNote>}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {PREF_LABELS.map((p) => (
            <View key={p.key} style={s.pref}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{p.label}</Text>
                <Text style={s.muted}>{p.description}</Text>
              </View>
              <Switch
                value={prefs[p.key] === true}
                disabled={!canEdit || update.isPending}
                onValueChange={(v) => save({ ...prefs, [p.key]: v })}
                trackColor={{ true: colors.primary }}
              />
            </View>
          ))}
        </Card>
        <UnavailableNote>
          Device alerts also require Android notification permission.
        </UnavailableNote>
      </View>
    </Screen>
  );
}

/* ---------------------------------------------------------- account ---- */

export function Account() {
  const user = useSession((state) => state.user);
  const tenant = useSession((state) => state.tenant);
  const { shop } = useShop();

  return (
    <Screen>
      <Header title="Account" />
      <View style={s.pad}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <IconRow icon="person-outline" label="Name" value={user?.name ?? '—'} />
          <IconRow icon="mail-outline" label="Email" value={user?.email ?? '—'} />
          <IconRow icon="shield-outline" label="Role" value={user?.tenantRole?.replace(/_/g, ' ') ?? user?.role ?? '—'} />
          <IconRow icon="business-outline" label="Shop" value={tenant?.name ?? shop.name} />
          <IconRow icon="call-outline" label="Phone" value={shop.phone ?? '—'} />
        </Card>
        <UnavailableNote>
          Password changes are handled in Muenot ERP. The mobile API does not expose a password endpoint.
        </UnavailableNote>
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------- help ---- */

export function Help() {
  const [faq, setFaq] = useState<number | null>(0);
  const qs = [
    ['How do I connect my WhatsApp number?', 'WhatsApp connections are set up in Muenot ERP by your administrator. Once connected, the status appears under Settings > WhatsApp.'],
    ['Why is my template pending approval?', "WhatsApp reviews templates before they can be used. The status shown here is the one Meta reported to Muenot ERP."],
    ['Can I add more team members?', 'Team members are added in Muenot ERP. Your plan determines how many seats you have.'],
    ['How do I upgrade my subscription?', 'Plan changes are handled in Muenot ERP. The Subscription screen shows your current plan and usage.'],
  ];
  return (
    <Screen>
      <Header title="Help & Support" />
      <View style={s.pad}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Pressable style={s.pref} onPress={() => Linking.openURL('mailto:support@muenot.com')}>
            <Icon name="mail-outline" />
            <Text style={[s.name, { flex: 1 }]}>Email Support</Text>
            <Icon name="chevron-forward" />
          </Pressable>
          <Pressable style={s.pref} onPress={() => Linking.openURL('tel:+911234567890')}>
            <Icon name="call-outline" />
            <Text style={[s.name, { flex: 1 }]}>Call Support</Text>
            <Icon name="chevron-forward" />
          </Pressable>
        </Card>
        <SectionTitle>Frequently Asked Questions</SectionTitle>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {qs.map(([q, a], i) => (
            <Pressable key={q} style={s.faq} onPress={() => setFaq(faq === i ? null : i)}>
              <View style={s.row}>
                <Text style={[s.name, { flex: 1 }]}>{q}</Text>
                <Icon name={faq === i ? 'chevron-up' : 'chevron-down'} color={colors.muted} />
              </View>
              {faq === i && <Text style={s.muted}>{a}</Text>}
            </Pressable>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

export function Legal({ terms = false }: { terms?: boolean }) {
  const text = terms
    ? [
        'By using Muenot Shopkeeper, you agree to use the app only for legitimate business communication with your customers.',
        'You are responsible for keeping your account credentials secure and for all activity that happens under your account.',
        "WhatsApp messaging campaigns must comply with WhatsApp's commerce and messaging policies, including obtaining consent before sending marketing messages.",
      ]
    : [
        'Muenot Shopkeeper respects your privacy. This app only accesses the business data needed to help you manage your shop — customers, orders, products and WhatsApp conversations.',
        'Your data is securely stored and processed by Muenot ERP. We never sell your business or customer data to third parties.',
        'WhatsApp messaging is powered by the official WhatsApp Business Platform through Muenot ERP.',
      ];
  return (
    <Screen>
      <Header title={terms ? 'Terms of Service' : 'Privacy Policy'} />
      <View style={s.legal}>
        {text.map((x) => (
          <Text key={x} style={s.muted}>
            {x}
          </Text>
        ))}
      </View>
    </Screen>
  );
}

/* --------------------------------------------------------- helpers ----- */

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Screen scroll={false}>
      <Header title={title} />
      {children}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.muted}>{label}</Text>
      <Text style={s.name}>{value}</Text>
    </View>
  );
}

function IconRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={s.pref}>
      <Icon name={icon} />
      <View style={{ flex: 1 }}>
        <Text style={s.muted}>{label}</Text>
        <Text style={s.name}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  profile: { margin: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  section: { paddingHorizontal: 16, paddingTop: 18 },
  pad: { padding: 16, gap: 14 },
  form: { padding: 16, gap: 14 },
  pair: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  error: { fontSize: 13, color: colors.danger },
  gap: { gap: 11 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hoursInputs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  center: { alignItems: 'center', padding: 28, gap: 10 },
  waIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, maxWidth: 280 },
  pref: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  check: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  faq: { padding: 14, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  legal: { padding: 20, gap: 16 },
});
