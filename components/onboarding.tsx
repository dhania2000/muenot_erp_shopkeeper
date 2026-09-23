import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { Badge, Button, Icon, Input } from './ui';
import { Header, Screen } from './screen';
import { ErrorState, Loading, UnavailableNote } from './states';
import { useShop, useUpdateShopProfile, useWhatsAppConnection } from '@/features/queries';
import { useWhatsAppOnboarding } from '@/features/whatsapp-onboarding';
import { useIsTenantAdmin, useSession } from '@/features/session';
import { errorMessage, isApiError } from '@/services/api/errors';

/**
 * Shop setup. Each step PATCHes the tenant profile, so a shopkeeper who quits
 * halfway keeps what they already entered. Only fields the backend stores are
 * collected — currency and timezone are free text because the profile accepts
 * them as strings and the API offers no list to choose from.
 */
const titles = ['Shop Details', 'Location', 'Business', 'WhatsApp'];
const NEXT = ['/onboarding/location', '/onboarding/business', '/onboarding/whatsapp', '/home'] as const;

export function Onboarding({ step }: { step: 0 | 1 | 2 | 3 }) {
  const { shop, isPending, isError, error, refetch } = useShop();

  if (isPending) {
    return (
      <Screen scroll={false}>
        <Header title="Shop Setup" />
        <Loading />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen scroll={false}>
        <Header title="Shop Setup" />
        <ErrorState error={error} onRetry={refetch} />
      </Screen>
    );
  }
  return <OnboardingStep key={step} step={step} shop={shop} />;
}

function OnboardingStep({ step, shop }: { step: 0 | 1 | 2 | 3; shop: ReturnType<typeof useShop>['shop'] }) {
  const update = useUpdateShopProfile();
  const canEdit = useIsTenantAdmin();

  const [shopName, setShopName] = useState(shop.name);
  const [ownerName, setOwnerName] = useState(shop.owner);
  const [businessCategory, setCategory] = useState(shop.category);
  const [address, setAddress] = useState(shop.address ?? '');
  const [city, setCity] = useState(shop.city);
  const [state, setState] = useState(shop.state);
  const [pinCode, setPin] = useState(shop.pinCode ?? '');
  const [country, setCountry] = useState(shop.country ?? 'India');
  const [gstin, setGstin] = useState(shop.gstin ?? '');
  const [website, setWebsite] = useState(shop.website ?? '');
  const [currency, setCurrency] = useState(shop.currency ?? 'INR');
  const [timezone, setTimezone] = useState(shop.timezone ?? 'Asia/Kolkata');

  const fieldError = (name: string) => (isApiError(update.error) ? update.error.fields?.[name] : undefined);

  const valid =
    step === 0
      ? shopName.trim().length > 1
      : step === 1
        ? address.trim().length > 3 && city.trim().length > 1
        : true;

  const patchFor = () =>
    step === 0
      ? { shopName: shopName.trim(), ownerName: ownerName.trim(), businessCategory: businessCategory.trim() }
      : step === 1
        ? { address: address.trim(), city: city.trim(), state: state.trim(), pinCode: pinCode.trim(), country: country.trim() }
        : { gstin: gstin.trim(), website: website.trim(), currency: currency.trim(), timezone: timezone.trim() };

  const advance = () => {
    if (!canEdit) return router.push(NEXT[step] as never);
    update.mutate(patchFor(), {
      // Only move on once the profile has actually been saved.
      onSuccess: () => router.push(NEXT[step] as never),
      onError: (e) => {
        if (isApiError(e) && e.fields) return;
        Alert.alert('Not saved', errorMessage(e));
      },
    });
  };

  return (
    <Screen keyboard>
      <Header title="Shop Setup" />
      <View style={s.progress}>
        {titles.map((x, i) => (
          <View key={x} style={[s.bar, i <= step && s.done]} />
        ))}
      </View>
      <Text style={s.step}>
        Step {step + 1} of 4 · {titles[step]}
      </Text>
      <View style={s.form}>
        {!canEdit && step !== 3 && (
          <UnavailableNote>Only the shop owner or an admin can change these details. You can continue without editing.</UnavailableNote>
        )}

        {step === 0 && (
          <>
            <Input label="Shop Name" value={shopName} onChangeText={setShopName} editable={canEdit} placeholder="Sharma General Store" error={fieldError('shopName')} />
            <Input label="Owner Name" value={ownerName} onChangeText={setOwnerName} editable={canEdit} placeholder="Rajesh Sharma" />
            <Input label="Business Category" value={businessCategory} onChangeText={setCategory} editable={canEdit} placeholder="Kirana Store" />
          </>
        )}

        {step === 1 && (
          <>
            <Input label="Address" multiline value={address} onChangeText={setAddress} editable={canEdit} placeholder="Shop no. 12, Main Market Road" />
            <Input label="City" value={city} onChangeText={setCity} editable={canEdit} placeholder="Lucknow" />
            <Input label="State" value={state} onChangeText={setState} editable={canEdit} placeholder="Uttar Pradesh" />
            <Input label="PIN Code" value={pinCode} onChangeText={setPin} keyboardType="numeric" editable={canEdit} placeholder="226001" />
            <Input label="Country" value={country} onChangeText={setCountry} editable={canEdit} placeholder="India" />
          </>
        )}

        {step === 2 && (
          <>
            <Input label="GSTIN" value={gstin} onChangeText={setGstin} autoCapitalize="characters" editable={canEdit} placeholder="22AAAAA0000A1Z5" error={fieldError('gstin')} />
            <Input label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" editable={canEdit} placeholder="www.yourshop.com" />
            <Input label="Currency" value={currency} onChangeText={setCurrency} autoCapitalize="characters" editable={canEdit} placeholder="INR" />
            <Input label="Timezone" value={timezone} onChangeText={setTimezone} autoCapitalize="none" editable={canEdit} placeholder="Asia/Kolkata" />
            <Text style={s.hint}>Business hours can be set later under Settings → Business Hours.</Text>
          </>
        )}

        {step === 3 && <WhatsAppStep />}

        {step !== 3 && (
          <View style={s.bottom}>
            <Button title="Continue" disabled={!valid} loading={update.isPending} onPress={advance} />
          </View>
        )}
      </View>
    </Screen>
  );
}

function WhatsAppStep() {
  const connection = useWhatsAppConnection();
  const onboarding = useWhatsAppOnboarding();
  const canConnect = useSession((s) => s.user?.role === 'admin' && (s.user?.tenantRole === 'tenant_owner' || s.user?.tenantRole === 'tenant_admin'));
  const ready = connection.data?.connected === true && connection.data.status === 'CONNECTED';

  return (
    <View style={s.wa}>
      <View style={s.circle}>
        <Icon name="logo-whatsapp" size={31} />
      </View>
      <Text style={s.waTitle}>Connect your WhatsApp</Text>
      <Text style={s.desc}>
        Connect through Muenot to receive and reply to customer messages in your inbox.
      </Text>
      <View style={s.connection}>
        <View style={{ flex: 1 }}>
          <Text style={s.waTitle}>WhatsApp Business</Text>
          <Text style={s.desc}>{ready ? connection.data?.phoneNumber || 'Connected' : connection.isPending ? 'Checking…' : 'No number connected'}</Text>
        </View>
        <Badge tone={ready ? 'success' : 'warning'}>{ready ? 'Connected' : 'Not connected'}</Badge>
      </View>
      {!ready && canConnect && <Button title="Connect WhatsApp" loading={onboarding.isConnecting} onPress={() => void onboarding.start()} />}
      {!!onboarding.error && <Text style={s.hint}>{onboarding.error}</Text>}
      <Button title={ready ? 'Go to Dashboard' : 'Continue to Dashboard'} onPress={() => router.replace('/home')} />
    </View>
  );
}

const s = StyleSheet.create({
  progress: { paddingHorizontal: 24, paddingTop: 18, flexDirection: 'row', gap: 6 },
  bar: { height: 6, flex: 1, borderRadius: 3, backgroundColor: '#e7ece9' },
  done: { backgroundColor: colors.primary },
  step: { paddingHorizontal: 24, paddingTop: 9, fontSize: 12, fontWeight: '700', color: colors.muted },
  form: { padding: 24, gap: 15, flex: 1 },
  bottom: { marginTop: 'auto' },
  hint: { fontSize: 12, color: colors.muted },
  wa: { alignItems: 'center', gap: 16, paddingTop: 20 },
  circle: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  waTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  desc: { fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  connection: { width: '100%', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
});
