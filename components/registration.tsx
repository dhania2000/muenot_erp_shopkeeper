import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Header, SectionTitle } from '@/components/screen';
import { Button, Icon, Input } from '@/components/ui';
import { colors } from '@/constants/theme';
import { appConfig } from '@/constants/config';
import { initialRegistrationForm, registrationPayload, validateRegistration, type RegistrationForm } from '@/features/registration';
import { useSession } from '@/features/session';

const CATEGORIES = ['Retail', 'Fashion', 'Jewellery', 'Grocery', 'Electronics', 'Beauty', 'Healthcare',
  'Restaurant/Food', 'Home & Furniture', 'Automotive', 'Services', 'Education', 'Other'];

export function RegistrationScreen() {
  const [form, setForm] = useState<RegistrationForm>(initialRegistrationForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const register = useSession((s) => s.register);
  const isRegistering = useSession((s) => s.isRegistering);
  const registrationError = useSession((s) => s.registrationError);
  const set = <K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) => {
    setForm((old) => ({ ...old, [key]: value }));
    setErrors((old) => ({ ...old, [key]: '' }));
  };
  const fieldError = (key: string) => errors[key] || (registrationError?.kind !== 'conflict' && registrationError?.field === key ? registrationError.message : undefined);
  const banner = registrationError?.kind === 'conflict'
    ? 'An account or application with this email or mobile number already exists.'
    : registrationError && !registrationError.field ? registrationError.message : null;
  const openLegal = (url: string | null) => {
    if (!url || !/^https:\/\//i.test(url)) {
      Alert.alert('Document unavailable', 'The published legal document link has not been configured yet.');
      return;
    }
    void Linking.openURL(url).catch(() => Alert.alert('Could not open document', 'Please try again later.'));
  };
  const submit = async () => {
    if (isRegistering) return;
    const found = validateRegistration(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (await register(registrationPayload(form))) {
      setForm(initialRegistrationForm); // never retain plaintext password after submission
      router.replace('/registration/status');
    }
  };
  const categories = CATEGORIES.filter((x) => x.toLowerCase().includes(categorySearch.trim().toLowerCase()));

  return <Screen keyboard>
    <Header title="Create Account" />
    <View style={s.form}>
      <Text style={s.intro}>Tell us about your shop. Muenot will review your application before you sign in.</Text>
      {!!banner && <Text accessibilityRole="alert" style={s.error}>{banner}</Text>}
      <SectionTitle>Business details</SectionTitle>
      <Input label="Shop / Business Name *" accessibilityLabel="Shop or Business Name" value={form.businessName} onChangeText={(v) => set('businessName', v)} returnKeyType="next" error={fieldError('businessName')} />
      <View>
        <Text style={s.label}>Business Category *</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose Business Category" style={s.selector} onPress={() => setCategoryOpen(true)}>
          <Text style={form.businessCategory ? s.value : s.placeholder}>{form.businessCategory || 'Choose a category'}</Text><Icon name="chevron-down" />
        </Pressable>
        {!!fieldError('businessCategory') && <Text style={s.error}>{fieldError('businessCategory')}</Text>}
      </View>
      <Input label="Owner Full Name *" accessibilityLabel="Owner Full Name" value={form.ownerName} onChangeText={(v) => set('ownerName', v)} returnKeyType="next" error={fieldError('ownerName')} />
      <Input label="Mobile Number *" accessibilityLabel="Mobile Number with country code" value={form.mobile} onChangeText={(v) => set('mobile', v)} keyboardType="phone-pad" placeholder="+919876543210" error={fieldError('mobile')} />
      <Input label="Email Address *" accessibilityLabel="Email Address" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={fieldError('email')} />
      <SectionTitle>Location</SectionTitle>
      <Input label="Country * (2-letter code)" accessibilityLabel="Two-letter Country code" value={form.country} onChangeText={(v) => set('country', v)} autoCapitalize="characters" maxLength={2} placeholder="IN" error={fieldError('country')} />
      <Input label="State / Region *" accessibilityLabel="State or Region" value={form.state} onChangeText={(v) => set('state', v)} error={fieldError('state')} />
      <Input label="City *" accessibilityLabel="City" value={form.city} onChangeText={(v) => set('city', v)} error={fieldError('city')} />
      <Input label="Postal Code" accessibilityLabel="Postal Code" value={form.postalCode} onChangeText={(v) => set('postalCode', v)} keyboardType="number-pad" error={fieldError('postalCode')} />
      <SectionTitle>Security</SectionTitle>
      <View><Input label="Password *" accessibilityLabel="Password" value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry={!passwordVisible} autoCapitalize="none" textContentType="newPassword" error={fieldError('password')} />
        <Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} onPress={() => setPasswordVisible((v) => !v)} style={s.eye}><Icon name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} /></Pressable></View>
      <View><Input label="Confirm Password *" accessibilityLabel="Confirm Password" value={form.confirmPassword} onChangeText={(v) => set('confirmPassword', v)} secureTextEntry={!confirmVisible} autoCapitalize="none" textContentType="newPassword" error={fieldError('confirmPassword')} />
        <Pressable accessibilityRole="button" accessibilityLabel={confirmVisible ? 'Hide confirmation' : 'Show confirmation'} onPress={() => setConfirmVisible((v) => !v)} style={s.eye}><Icon name={confirmVisible ? 'eye-off-outline' : 'eye-outline'} /></Pressable></View>
      <Text style={s.hint}>At least 8 characters, including a letter and a number.</Text>
      <SectionTitle>Consent</SectionTitle>
      <Consent checked={form.termsAccepted} onToggle={() => set('termsAccepted', !form.termsAccepted)} label="I agree to the" link="Terms & Conditions" onLink={() => openLegal(appConfig.termsUrl)} error={fieldError('termsAccepted')} />
      <Consent checked={form.privacyAccepted} onToggle={() => set('privacyAccepted', !form.privacyAccepted)} label="I agree to the" link="Privacy Policy" onLink={() => openLegal(appConfig.privacyUrl)} error={fieldError('privacyAccepted')} />
      <Button title="Create Account" loading={isRegistering} onPress={submit} />
      <Button title="Already have an account? Login" variant="ghost" onPress={() => router.replace('/login')} />
    </View>
    <Modal visible={categoryOpen} animationType="slide" transparent onRequestClose={() => setCategoryOpen(false)}>
      <View style={s.modalShade}><View style={s.modal}>
        <View style={s.modalHeader}><Text style={s.modalTitle}>Business Category</Text><Pressable accessibilityRole="button" accessibilityLabel="Close categories" onPress={() => setCategoryOpen(false)}><Icon name="close" /></Pressable></View>
        <TextInput accessibilityLabel="Search categories" style={s.search} placeholder="Search categories" value={categorySearch} onChangeText={setCategorySearch} />
        <ScrollView keyboardShouldPersistTaps="handled">{categories.map((category) => <Pressable key={category} accessibilityRole="button" style={s.category} onPress={() => { set('businessCategory', category); setCategoryOpen(false); setCategorySearch(''); }}><Text style={s.value}>{category}</Text></Pressable>)}</ScrollView>
      </View></View>
    </Modal>
  </Screen>;
}

function Consent({ checked, onToggle, label, link, onLink, error }: { checked: boolean; onToggle: () => void; label: string; link: string; onLink: () => void; error?: string }) {
  return <View><View style={s.consent}>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={`Accept ${link}`} onPress={onToggle} style={[s.check, checked && s.checked]}>{checked && <Icon name="checkmark" size={18} color="#fff" />}</Pressable>
    <Text style={s.value} onPress={onToggle}>{label} </Text><Text accessibilityRole="link" onPress={onLink} style={s.link}>{link}</Text>
  </View>{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}</View>;
}

const s = StyleSheet.create({
  form: { padding: 22, gap: 15 }, intro: { color: colors.muted, lineHeight: 21, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 7 },
  selector: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.card, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { color: colors.text, fontSize: 14 }, placeholder: { color: colors.muted, fontSize: 14 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: 4 }, hint: { color: colors.muted, fontSize: 12 },
  eye: { position: 'absolute', right: 10, top: 30, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  consent: { minHeight: 48, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  check: { width: 28, height: 28, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 6 }, checked: { backgroundColor: colors.primary },
  link: { color: colors.primary, fontWeight: '700' },
  modalShade: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }, modal: { backgroundColor: colors.background, padding: 22, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, modalTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  search: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.card, paddingHorizontal: 14, marginBottom: 8 },
  category: { minHeight: 46, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
});
