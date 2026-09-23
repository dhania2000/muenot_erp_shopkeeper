import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, Header } from '@/components/screen';
import { Button, Icon, Badge } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSession } from '@/features/session';

export default function RegistrationStatusScreen() {
  const status = useSession((s) => s.registrationStatus);
  const error = useSession((s) => s.registrationError);
  const checking = useSession((s) => s.isCheckingRegistration);
  const refresh = useSession((s) => s.refreshRegistrationStatus);
  const clear = useSession((s) => s.clearRegistration);
  const logout = useSession((s) => s.logout);
  const state = status?.status;
  const title = state === 'APPROVED' ? "You're approved!" : state === 'REJECTED' ? 'Account needs attention' : state === 'SUSPENDED' ? 'Account suspended' : state === 'PENDING_APPROVAL' ? 'Account submitted' : 'Check your account';
  const detail = state === 'APPROVED' ? 'Your Muenot Shopkeeper account is ready. Sign in with the email and password you registered.'
    : state === 'REJECTED' ? 'Your application could not be approved.'
    : state === 'SUSPENDED' ? 'Your Muenot Shopkeeper account is currently unavailable.'
    : state === 'PENDING_APPROVAL' ? "Muenot will review your account. You'll be able to manage your shop once approved."
    : 'Connect to the internet and refresh your application status.';
  const useAnother = async () => { await logout(); await clear(); router.replace('/login'); };
  return <Screen><Header title="Account status" back={false} />
    <View style={s.content}>
      <View style={s.icon}><Icon name={state === 'APPROVED' ? 'checkmark-circle-outline' : state === 'REJECTED' || state === 'SUSPENDED' ? 'alert-circle-outline' : 'time-outline'} size={36} /></View>
      <Text style={s.title}>{title}</Text><Text style={s.detail}>{detail}</Text>
      {!!status && <View style={s.card}>
        <Text style={s.label}>Business</Text><Text style={s.value}>{status.businessName}</Text>
        <Text style={s.label}>Owner</Text><Text style={s.value}>{status.ownerName}</Text>
        <Text style={s.label}>Status</Text><Badge tone={state === 'APPROVED' ? 'success' : state === 'REJECTED' || state === 'SUSPENDED' ? 'danger' : 'warning'}>{state?.replaceAll('_', ' ')}</Badge>
      </View>}
      {state === 'REJECTED' && !!status?.rejectionReason && <Text style={s.reason}>{status.rejectionReason}</Text>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error.message}{status ? ' Showing your last known status.' : ''}</Text>}
      {state !== 'APPROVED' && <Button title="Refresh Status" loading={checking} onPress={() => void refresh()} />}
      {state === 'APPROVED' && <Button title="Continue to Login" onPress={() => router.replace('/login')} />}
      <Button title="Logout / Use another account" variant="outline" onPress={() => void useAnother()} />
    </View>
  </Screen>;
}

const s = StyleSheet.create({
  content: { padding: 24, gap: 16, alignItems: 'stretch' }, icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.text, fontSize: 23, fontWeight: '800', textAlign: 'center' }, detail: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, gap: 6 },
  label: { color: colors.muted, fontSize: 12 }, value: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  reason: { color: colors.text, backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 14 }, error: { color: colors.danger, fontSize: 13 },
});
