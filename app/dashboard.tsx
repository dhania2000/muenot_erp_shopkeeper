import { useEffect, useMemo, useState } from "react"
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
  FontAwesome5,
  Feather,
} from "@expo/vector-icons"

const COLORS = {
  bg: "#F1F5F1",
  card: "#FFFFFF",
  primary: "#1F6E4C",
  primaryDark: "#124A32",
  green: "#25D366",
  ink: "#0E1A12",
  inkSoft: "#5B6B60",
  mint: "#CFE9D8",
  mintSoft: "#E4F3EA",
  line: "#E3EAE4",
  amber: "#C6803A",
  amberSoft: "#FBE7CF",
  blue: "#2F6BD3",
  blueSoft: "#DDE8FB",
  purple: "#7A4FD1",
  purpleSoft: "#EBE3FB",
  redSoft: "#FBE0DA",
  red: "#E1533B",
  danger: "#E1533B",
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function formatClock(d: Date) {
  let h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, "0")
  const s = d.getSeconds().toString().padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12
  return { time: `${h}:${m}:${s}`, ampm }
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const contentWidth = useMemo(() => Math.min(width, 480), [width])

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const clock = formatClock(now)
  const dateLabel = `${DAYS[now.getDay()]}, ${now.getDate()} ${
    MONTHS[now.getMonth()]
  } ${now.getFullYear()}`
  const greeting = greetingFor(now.getHours())

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
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.shopRow}>
              <Pressable
                style={styles.avatar}
                onPress={() => router.push("/more")}
              >
                <Text style={styles.avatarText}>MB</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>Mubarik bangles</Text>
                <Text style={styles.shopMeta}>Bangles • Retail Shop</Text>
                <Pressable style={styles.proPill}>
                  <MaterialCommunityIcons
                    name="crown"
                    size={13}
                    color={COLORS.primary}
                  />
                  <Text style={styles.proText}>Pro Shop</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={COLORS.primary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.topActions}>
              <Pressable style={styles.iconBtn}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={COLORS.ink}
                />
                <View style={styles.dot} />
              </Pressable>
              <Pressable style={styles.iconBtn}>
                <Ionicons name="settings-outline" size={20} color={COLORS.ink} />
              </Pressable>
            </View>
          </View>

          {/* Greeting + clock/date */}
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetTitle}>
                {greeting}, <Text style={styles.greetName}>Mubarik</Text> 👋
              </Text>
              <Text style={styles.greetSub}>
                Here&apos;s what&apos;s happening in your shop today.
              </Text>
            </View>
          </View>

          {/* Live clock + date card */}
          <View style={styles.clockCard}>
            <View style={styles.clockLeft}>
              <View style={styles.sunIcon}>
                <Feather name="sun" size={16} color={COLORS.amber} />
              </View>
              <View>
                <Text style={styles.clockDate}>{dateLabel}</Text>
                <Text style={styles.clockNote}>Have a great day!</Text>
              </View>
            </View>
            <View style={styles.clockTimeWrap}>
              <Text style={styles.clockTime}>{clock.time}</Text>
              <Text style={styles.clockAmpm}>{clock.ampm}</Text>
            </View>
          </View>

          {/* WhatsApp Business */}
          <View style={styles.waCard}>
            <View style={styles.waIcon}>
              <FontAwesome5 name="whatsapp" size={26} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.waTitle}>WhatsApp Business</Text>
              <Text style={styles.waPhone}>7665748940</Text>
              <View style={styles.waStatus}>
                <View style={styles.waStatusDot} />
                <Text style={styles.waStatusText}>Not connected</Text>
              </View>
              <Text style={styles.waHint}>
                Connect your WhatsApp to start receiving messages.
              </Text>
            </View>
            <Pressable style={styles.connectBtn}>
              <Text style={styles.connectText}>Connect</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Stat grid */}
          <View style={styles.statGrid}>
            <StatCard
              tint={COLORS.mintSoft}
              icon={
                <Ionicons
                  name="chatbubbles-outline"
                  size={18}
                  color={COLORS.primary}
                />
              }
              value="0"
              label="Today's Messages"
            />
            <StatCard
              tint={COLORS.redSoft}
              icon={
                <Ionicons name="chatbubble" size={16} color={COLORS.red} />
              }
              value="0"
              label="Unread Chats"
            />
            <StatCard
              tint={COLORS.blueSoft}
              icon={<Feather name="shopping-bag" size={16} color={COLORS.blue} />}
              value="0"
              label="Today's Orders"
            />
            <StatCard
              tint={COLORS.purpleSoft}
              icon={
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={16}
                  color={COLORS.purple}
                />
              }
              value="0"
              label="Pending Orders"
            />
            <StatCard
              tint={COLORS.mintSoft}
              icon={<FontAwesome5 name="money-bill-wave" size={14} color={COLORS.primary} />}
              value="₹0"
              label="Today's Sales"
            />
            <StatCard
              tint={COLORS.blueSoft}
              icon={
                <MaterialCommunityIcons
                  name="account-group"
                  size={18}
                  color={COLORS.blue}
                />
              }
              value="1"
              label="Customers"
            />
          </View>

          {/* Quick actions */}
          <SectionHeader title="Quick Actions" action="See all" />
          <View style={styles.quickRow}>
            <QuickAction
              tint={COLORS.mintSoft}
              icon={<FontAwesome5 name="whatsapp" size={20} color={COLORS.primary} />}
              label="Open Inbox"
            />
            <QuickAction
              tint={COLORS.amberSoft}
              icon={<Feather name="shopping-bag" size={20} color={COLORS.amber} />}
              label="New Order"
            />
            <QuickAction
              tint={COLORS.blueSoft}
              icon={<Ionicons name="person-add-outline" size={20} color={COLORS.blue} />}
              label="Add Customer"
            />
            <QuickAction
              tint={COLORS.purpleSoft}
              icon={
                <MaterialCommunityIcons
                  name="cube-outline"
                  size={20}
                  color={COLORS.purple}
                />
              }
              label="Add Product"
            />
          </View>

          {/* Recent messages */}
          <SectionHeader title="Recent Messages" action="View all" />
          <View style={styles.emptyCard}>
            <Ionicons
              name="chatbubbles-outline"
              size={40}
              color={COLORS.mint}
            />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>
              Connect WhatsApp to start receiving messages from your customers.
            </Text>
            <Pressable style={styles.emptyBtn}>
              <FontAwesome5 name="whatsapp" size={14} color={COLORS.primary} />
              <Text style={styles.emptyBtnText}>Connect WhatsApp</Text>
            </Pressable>
          </View>

          {/* Recent orders */}
          <SectionHeader title="Recent Orders" action="View all" />
          <View style={styles.emptyCard}>
            <Feather name="package" size={38} color={COLORS.line} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>
              Orders from WhatsApp and manual orders will appear here.
            </Text>
            <Pressable style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Create First Order</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
        <TabItem icon="home" label="Home" active />
        <TabItem icon="chatbubble-outline" label="Inbox" />
        <TabItem icon="bag-handle-outline" label="Orders" />
        <TabItem icon="people-outline" label="Customers" />
        <TabItem icon="menu-outline" label="More" />
      </View>
    </View>
  )
}

function StatCard({
  tint,
  icon,
  value,
  label,
}: {
  tint: string
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <Pressable style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.inkSoft} />
    </Pressable>
  )
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable style={styles.sectionAction}>
        <Text style={styles.sectionActionText}>{action}</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </Pressable>
    </View>
  )
}

function QuickAction({
  tint,
  icon,
  label,
}: {
  tint: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Pressable style={styles.quickAction}>
      <View style={[styles.quickIcon, { backgroundColor: tint }]}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  )
}

function TabItem({
  icon,
  label,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active?: boolean
}) {
  return (
    <Pressable style={styles.tabItem}>
      <Ionicons
        name={icon}
        size={22}
        color={active ? COLORS.primary : COLORS.inkSoft}
      />
      <Text style={[styles.tabLabel, active && { color: COLORS.primary }]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { alignItems: "center", paddingHorizontal: 18 },
  container: { gap: 16 },

  // top bar
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  shopRow: { flexDirection: "row", gap: 12, flex: 1 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#8A5A44",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  shopName: { fontSize: 17, fontWeight: "800", color: COLORS.ink },
  shopMeta: { fontSize: 12, color: COLORS.inkSoft, marginTop: 1 },
  proPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: COLORS.mintSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
  proText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0E1A12",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },

  // greeting
  greetRow: { flexDirection: "row", alignItems: "center" },
  greetTitle: { fontSize: 26, fontWeight: "800", color: COLORS.ink },
  greetName: { color: COLORS.primary },
  greetSub: { fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },

  // clock card
  clockCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.amberSoft,
    borderRadius: 16,
    padding: 14,
  },
  clockLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sunIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  clockDate: { fontSize: 13, fontWeight: "800", color: "#8A5A1E" },
  clockNote: { fontSize: 12, color: "#A9803F", marginTop: 1 },
  clockTimeWrap: { alignItems: "flex-end" },
  clockTime: {
    fontSize: 20,
    fontWeight: "800",
    color: "#8A5A1E",
    fontVariant: ["tabular-nums"],
  },
  clockAmpm: { fontSize: 11, fontWeight: "700", color: "#A9803F" },

  // whatsapp card
  waCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#0E1A12",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  waIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  waTitle: { fontSize: 15, fontWeight: "800", color: COLORS.ink },
  waPhone: { fontSize: 13, color: COLORS.inkSoft, marginTop: 1 },
  waStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.redSoft,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 5,
  },
  waStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  waStatusText: { fontSize: 11, fontWeight: "700", color: COLORS.danger },
  waHint: { fontSize: 11, color: COLORS.inkSoft, marginTop: 6 },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  connectText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },

  // stat grid
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  statCard: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#0E1A12",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  statLabel: { fontSize: 11, color: COLORS.inkSoft, marginTop: 1 },

  // section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 2 },
  sectionActionText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },

  // quick actions
  quickRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    shadowColor: "#0E1A12",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },

  // empty cards
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    gap: 8,
    shadowColor: "#0E1A12",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: COLORS.ink },
  emptySub: {
    fontSize: 12,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.mintSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },

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
  tabLabel: { fontSize: 11, fontWeight: "600", color: COLORS.inkSoft },
})
