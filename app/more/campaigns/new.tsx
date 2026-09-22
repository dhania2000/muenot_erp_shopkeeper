import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Header, Screen } from '@/components/screen';
import { Button, Icon } from '@/components/ui';
import { colors } from '@/constants/theme';

/**
 * The mobile API exposes campaigns read-only (GET /campaigns). Creating one
 * requires audience selection and consent checks that live in Muenot ERP, so
 * the app deliberately does not offer a bulk sender of its own.
 */
export default function NewCampaign() {
  return (
    <Screen>
      <Header title="New Campaign" />
      <View style={s.body}>
        <View style={s.round}>
          <Icon name="megaphone-outline" size={30} />
        </View>
        <Text style={s.title}>Campaigns are created in Muenot ERP</Text>
        <Text style={s.desc}>
          Building a campaign needs audience selection, template approval and customer consent checks. Those are
          enforced in Muenot ERP, so campaigns are created there and tracked here.
        </Text>
        <View style={s.buttons}>
          <Button title="Back to Campaigns" onPress={() => router.replace('/more/campaigns')} />
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 14 },
  round: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  desc: { fontSize: 14, color: colors.muted, lineHeight: 21, textAlign: 'center' },
  buttons: { alignSelf: 'stretch', marginTop: 8 },
});
