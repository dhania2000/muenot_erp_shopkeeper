import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors } from '@/constants/theme';
import { Button, Input, Icon } from './ui';
import { Header, Screen } from './screen';
import { useSession } from '@/features/session';
export { RegistrationScreen as Signup } from './registration';

export function Welcome() {
  const points = [
    ['chatbubble-outline', 'WhatsApp conversations'],
    ['people-outline', 'Customers & relationships'],
    ['bag-outline', 'Orders, start to finish'],
    ['cube-outline', 'Products & inventory'],
  ];
  return (
    <Screen>
      <View style={s.welcome}>
        <View style={s.logoRow}>
          <View style={s.logo}>
            <Image source={require('@/assets/images/logo-mark.png')} style={s.logoImage} />
          </View>
          <Text style={s.brand}>Muenot Shopkeeper</Text>
        </View>
        <View style={s.middle}>
          <Text style={s.hero}>Run your business{`\n`}from your phone</Text>
          <Text style={s.desc}>
            Manage WhatsApp, customers, orders, products and business communication — all from one simple app.
          </Text>
          <View style={s.grid}>
            {points.map(([icon, label]) => (
              <View key={label} style={s.point}>
                <View style={s.round}>
                  <Icon name={icon as any} />
                </View>
                <Text style={s.pointText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.buttons}>
          <Button title="Login" onPress={() => router.push('/login')} />
          <Button title="Get Started" variant="outline" onPress={() => router.push('/signup')} />
        </View>
      </View>
    </Screen>
  );
}

/**
 * Login talks to POST /auth/login, which authenticates on email + password
 * only. The field was previously labelled "Email or Mobile Number"; the
 * backend has never accepted a number, so the label now matches reality.
 */
export function Login() {
  const login = useSession((state) => state.login);
  const isLoggingIn = useSession((state) => state.isLoggingIn);
  const loginError = useSession((state) => state.loginError);
  const registrationStatus = useSession((state) => state.registrationStatus);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const valid = /\S+@\S+\.\S+/.test(email.trim()) && pw.length > 0;

  const submit = async () => {
    if (!valid || isLoggingIn) return;
    if (await login(email, pw)) router.replace('/home');
    else if (registrationStatus && registrationStatus.status !== 'APPROVED') router.replace('/registration/status');
  };

  // A 422 names the offending field; anything else is a banner above the form.
  const fieldError = (name: string) => loginError?.fields?.[name];
  const banner = loginError && !loginError.fields ? loginError.message : null;

  return (
    <Screen keyboard>
      <Header title="Welcome back" back={false} />
      <View style={s.form}>
        <Text style={s.desc}>Login to manage your shop</Text>
        {banner && (
          <View style={s.banner}>
            <Icon name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={s.bannerText}>{banner}</Text>
          </View>
        )}
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          placeholder="you@shop.com"
          error={fieldError('email')}
        />
        <Input
          label="Password"
          value={pw}
          onChangeText={setPw}
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
          placeholder="Enter your password"
          onSubmitEditing={submit}
          error={fieldError('password')}
        />
        <Link href="/login/forgot-password">
          <Text style={s.link}>Forgot Password?</Text>
        </Link>
        <View style={{ marginTop: 'auto', gap: 15 }}>
          <Button title="Login" disabled={!valid} loading={isLoggingIn} onPress={submit} />
          <Text style={s.center}>
            Don't have an account?{' '}
            <Text style={s.link} onPress={() => router.push('/signup')}>
              Create Account
            </Text>
          </Text>
        </View>
      </View>
    </Screen>
  );
}

/**
 * Likewise there is no password-reset endpoint on the mobile API. Showing a
 * "reset link sent" confirmation would be a lie, so this routes the user to
 * the people who can actually reset it.
 */
export function ForgotPassword() {
  return (
    <Screen>
      <Header title="Forgot Password" />
      <View style={s.notice}>
        <View style={s.round}>
          <Icon name="key-outline" size={30} />
        </View>
        <Text style={s.heroSmall}>Reset from the ERP</Text>
        <Text style={s.desc}>
          Password resets are handled in Muenot ERP. Ask your shop owner or the Muenot support team to reset it, then
          sign in here with the new password.
        </Text>
        <View style={s.noticeButtons}>
          <Button title="Back to Login" onPress={() => router.replace('/login')} />
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  welcome: { flex: 1, padding: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 25, height: 25, borderRadius: 8 },
  brand: { fontSize: 14, fontWeight: '800', color: colors.text },
  middle: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 22 },
  hero: { fontSize: 31, fontWeight: '800', textAlign: 'center', lineHeight: 38, color: colors.text },
  heroSmall: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  desc: { fontSize: 14, color: colors.muted, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  point: { width: '47%', borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 14, alignItems: 'center', gap: 8 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  pointText: { fontSize: 12, fontWeight: '700', textAlign: 'center', color: colors.text },
  buttons: { gap: 10 },
  form: { flex: 1, padding: 22, gap: 15 },
  link: { fontSize: 13, fontWeight: '800', color: colors.primary },
  center: { fontSize: 13, textAlign: 'center', color: colors.muted },
  notice: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 15 },
  noticeButtons: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.dangerSoft },
  bannerText: { flex: 1, fontSize: 13, color: colors.danger, fontWeight: '600', lineHeight: 18 },
});
