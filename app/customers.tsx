import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

const COLORS = {
  bg: "#F1F5F1",
  card: "#FFFFFF",
  primary: "#1F6E4C",
  primaryDark: "#124A32",
  ink: "#0E1A12",
  inkSoft: "#5B6B60",
  mint: "#CFE9D8",
  mintSoft: "#E4F3EA",
  line: "#E3EAE4",
  chip: "#E9EEE9",
  chipCount: "#D4DCD4",
  brown: "#9C6B44",
  searchBg: "#EDF2ED",
}

const FILTERS = [
  { key: "all", label: "All", count: 1 },
  { key: "new", label: "New", count: 0 },
  { key: "regular", label: "Regular", count: 1 },
  { key: "vip", label: "VIP", count: 0 },
]

const CUSTOMERS = [
  {
    id: "1",
    name: "Sandeep",
    phone: "39876466488",
    tag: "Regular Customer",
    initial: "S",
    type: "regular",
  },
]

export default function CustomersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const contentWidth = Math.min(width, 480)
  const [active, setActive] = useState("all")
  const [query, setQuery] = useState("")

  const filtered = CUSTOMERS.filter((c) => {
    const matchesFilter = active === "all" || c.type === active
    const matchesQuery =
      query.trim() === "" ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
    return matchesFilter && matchesQuery
  })

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
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Customers</Text>
              <Text style={styles.subtitle}>
                Manage your customers and build strong relationships
              </Text>
            </View>
            <Pressable style={styles.addBtn}>
              <Ionicons name="person-add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.search}>
            <Ionicons name="search" size={20} color={COLORS.inkSoft} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone or email..."
              placeholderTextColor={COLORS.inkSoft}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* Filter chips */}
          <View style={styles.chipRow}>
            {FILTERS.map((f) => {
              const isActive = active === f.key
              return (
                <Pressable
                  key={f.key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActive(f.key)}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      isActive && styles.chipLabelActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                  <View
                    style={[
                      styles.chipCount,
                      isActive && styles.chipCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipCountText,
                        isActive && styles.chipCountTextActive,
                      ]}
                    >
                      {f.count}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>

          {/* Total customers stat */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={26} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel}>Total Customers</Text>
              <Text style={styles.statValue}>{CUSTOMERS.length}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={styles.statBadge}>
                <Ionicons name="arrow-up" size={13} color={COLORS.primary} />
                <Text style={styles.statBadgeText}>100%</Text>
              </View>
              <Text style={styles.statVs}>vs last month</Text>
            </View>
          </View>

          {/* Customer list */}
          <View style={{ gap: 12 }}>
            {filtered.map((c) => (
              <View key={c.id} style={styles.customerCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{c.initial}</Text>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  <View style={styles.phoneRow}>
                    <Ionicons name="call" size={14} color={COLORS.inkSoft} />
                    <Text style={styles.customerPhone}>{c.phone}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{c.tag}</Text>
                  </View>
                </View>
                <Pressable style={styles.rowAction}>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.inkSoft}
                  />
                </Pressable>
                <Pressable style={styles.rowAction}>
                  <Ionicons
                    name="ellipsis-vertical"
                    size={18}
                    color={COLORS.inkSoft}
                  />
                </Pressable>
              </View>
            ))}
          </View>
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
        <TabItem icon="people" label="Customers" active />
        <TabItem icon="menu-outline" label="More" />
      </View>
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
  container: { gap: 18 },

  // header
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { fontSize: 30, fontWeight: "800", color: COLORS.ink },
  subtitle: { fontSize: 13, color: COLORS.inkSoft, marginTop: 3 },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // search
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.searchBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.ink, padding: 0 },

  // chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.chip,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 8,
    borderRadius: 22,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipLabel: { fontSize: 14, fontWeight: "700", color: COLORS.inkSoft },
  chipLabelActive: { color: "#FFFFFF" },
  chipCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: COLORS.chipCount,
    alignItems: "center",
    justifyContent: "center",
  },
  chipCountActive: { backgroundColor: "#FFFFFF" },
  chipCountText: { fontSize: 12, fontWeight: "800", color: COLORS.inkSoft },
  chipCountTextActive: { color: COLORS.primary },

  // stat card
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.mintSoft,
    borderRadius: 18,
    padding: 18,
  },
  statIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: COLORS.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 15, fontWeight: "600", color: COLORS.ink },
  statValue: { fontSize: 26, fontWeight: "800", color: COLORS.ink, marginTop: 2 },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statBadgeText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  statVs: { fontSize: 12, color: COLORS.inkSoft },

  // customer card
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brown,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  customerName: { fontSize: 19, fontWeight: "800", color: COLORS.ink },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  customerPhone: { fontSize: 15, color: COLORS.inkSoft, fontWeight: "600" },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.mintSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  rowAction: { padding: 4 },

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
