import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons"

const COLORS = {
  bg: "#F1F5F1",
  card: "#FFFFFF",
  primary: "#1F6E4C",
  ink: "#0E1A12",
  inkSoft: "#5B6B60",
  mint: "#CFE9D8",
  mintSoft: "#E4F3EA",
  line: "#E3EAE4",
  brown: "#9C6B44",
}

type IconRender = React.ReactNode

const BUSINESS: { key: string; label: string; icon: IconRender }[] = [
  {
    key: "products",
    label: "Products",
    icon: <MaterialCommunityIcons name="cube-outline" size={22} color={COLORS.primary} />,
  },
  {
    key: "templates",
    label: "Templates",
    icon: <Feather name="file-text" size={20} color={COLORS.primary} />,
  },
  {
    key: "campaigns",
    label: "Campaigns",
    icon: <MaterialCommunityIcons name="bullhorn-outline" size={22} color={COLORS.primary} />,
  },
  {
    key: "automations",
    label: "Automations",
    icon: <MaterialCommunityIcons name="sitemap-outline" size={22} color={COLORS.primary} />,
  },
]

const MANAGEMENT: { key: string; label: string; icon: IconRender }[] = [
  {
    key: "team",
    label: "Team",
    icon: <Ionicons name="people-outline" size={22} color={COLORS.primary} />,
  },
  {
    key: "reports",
    label: "Reports",
    icon: <Ionicons name="bar-chart-outline" size={20} color={COLORS.primary} />,
  },
  {
    key: "subscription",
    label: "Subscription",
    icon: <Ionicons name="card-outline" size={20} color={COLORS.primary} />,
  },
]

const PREFERENCES: { key: string; label: string; icon: IconRender }[] = [
  {
    key: "notifications",
    label: "Notifications",
    icon: <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />,
  },
  {
    key: "settings",
    label: "Settings",
    icon: <Ionicons name="settings-outline" size={20} color={COLORS.primary} />,
  },
]

export default function MoreScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const contentWidth = Math.min(width, 480)

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: 90 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { width: contentWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
            </Pressable>
            <Text style={styles.title}>More</Text>
          </View>

          {/* Profile card */}
          <Pressable style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>MB</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>Mubarik bangles</Text>
              <Text style={styles.profileSub}>Mubarik</Text>
            </View>
          </Pressable>

          {/* Business */}
          <Text style={styles.sectionLabel}>Business</Text>
          <MenuGroup items={BUSINESS} />

          {/* Management */}
          <Text style={styles.sectionLabel}>Management</Text>
          <MenuGroup items={MANAGEMENT} />

          {/* Preferences */}
          <Text style={styles.sectionLabel}>Preferences</Text>
          <MenuGroup items={PREFERENCES} />
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
        <TabItem
          icon="home-outline"
          label="Home"
          onPress={() => router.replace("/dashboard")}
        />
        <TabItem icon="chatbubble-outline" label="Inbox" />
        <TabItem
          icon="bag-handle-outline"
          label="Orders"
          onPress={() => router.replace("/orders")}
        />
        <TabItem
          icon="people-outline"
          label="Customers"
          onPress={() => router.replace("/customers")}
        />
      </View>
    </View>
  )
}

function MenuGroup({
  items,
}: {
  items: { key: string; label: string; icon: IconRender }[]
}) {
  return (
    <View style={styles.group}>
      {items.map((item, i) => (
        <Pressable
          key={item.key}
          style={[styles.row, i < items.length - 1 && styles.rowBorder]}
        >
          <View style={styles.rowIcon}>{item.icon}</View>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.inkSoft} />
        </Pressable>
      ))}
    </View>
  )
}

function TabItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable style={styles.tabItem} onPress={onPress}>
      <View style={active ? styles.tabActiveWrap : undefined}>
        <Ionicons
          name={icon}
          size={22}
          color={active ? COLORS.primary : COLORS.inkSoft}
        />
      </View>
      <Text style={[styles.tabLabel, active && { color: COLORS.primary }]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { alignItems: "center", paddingHorizontal: 18 },
  container: { gap: 14 },

  // header
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "800", color: COLORS.primary },

  // profile card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 18,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.brown,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  profileName: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  profileSub: { fontSize: 14, color: COLORS.inkSoft, marginTop: 2 },

  // sections
  sectionLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 8,
  },
  group: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.line },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.mintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 17, fontWeight: "800", color: COLORS.ink },

  // tab bar
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 8,
    shadowColor: "#0E1A12",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  tabItem: { alignItems: "center", gap: 3, flex: 1 },
  tabActiveWrap: {
    backgroundColor: COLORS.mintSoft,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 14,
  },
  tabLabel: { fontSize: 11, fontWeight: "600", color: COLORS.inkSoft },
})
