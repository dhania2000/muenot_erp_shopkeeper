import { StyleSheet, Text, View } from 'react-native';
import { Screen, SectionTitle } from '@/components/screen';
import { Avatar, MenuItem } from '@/components/common';
import { Card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useShop } from '@/features/queries';
import { isEntitled, useSession, type ShopkeeperFeature } from '@/features/session';

type Entry = [href: string, label: string, icon: string, feature?: ShopkeeperFeature];

const SECTIONS: [string, Entry[]][] = [
  [
    'Business',
    [
      ['/more/products', 'Products', 'cube-outline', 'products'],
      ['/more/templates', 'Templates', 'document-text-outline', 'templates'],
      ['/more/campaigns', 'Campaigns', 'megaphone-outline', 'campaigns'],
      ['/more/automations', 'Automations', 'git-network-outline', 'automations'],
    ],
  ],
  [
    'Management',
    [
      ['/more/team', 'Team', 'people-outline', 'team'],
      ['/more/reports', 'Reports', 'bar-chart-outline'],
      ['/more/subscription', 'Subscription', 'card-outline', 'subscription'],
    ],
  ],
  [
    'Preferences',
    [
      ['/notifications', 'Notifications', 'notifications-outline', 'notifications'],
      ['/more/settings', 'Settings', 'settings-outline', 'settings'],
    ],
  ],
];

/**
 * Menu entries are hidden for modules the plan does not include. This is UX
 * only — the backend still authorises every request and answers 403 whether
 * or not the entry was visible.
 */
export default function More() {
  const { shop } = useShop();
  const session = useSession();

  const sections = SECTIONS.map(
    ([title, entries]) => [title, entries.filter((e) => !e[3] || isEntitled(session, e[3]))] as const,
  ).filter(([, entries]) => entries.length > 0);

  return (
    <Screen>
      <Text style={s.title}>More</Text>
      <Card style={s.profile}>
        <Avatar name={shop.name} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>
            {shop.name}
          </Text>
          <Text style={s.muted} numberOfLines={1}>
            {shop.owner || session.user?.email || ''}
          </Text>
        </View>
      </Card>
      {sections.map(([title, entries]) => (
        <View key={title} style={s.section}>
          <SectionTitle>{title}</SectionTitle>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {entries.map((x) => (
              <MenuItem key={x[0]} href={x[0]} label={x[1]} icon={x[2]} />
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { padding: 16, fontSize: 21, fontWeight: '800', color: colors.text },
  profile: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  muted: { fontSize: 12, color: colors.muted },
  section: { paddingHorizontal: 16, paddingTop: 20 },
});
