import { useState } from "react"
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
  primaryDark: "#124A32",
  ink: "#0E1A12",
  inkSoft: "#5B6B60",
  mint: "#CFE9D8",
  mintSoft: "#E4F3EA",
  line: "#E3EAE4",
  amber: "#C6803A",
  amberSoft: "#FBE7CF",
  blue: "#2F6BD3",
  blueSoft: "#DDE8FB",
  chip: "#E9EEE9",
  chipCount: "#D4DCD4",
}

const FILTERS = [
  { key: "all", label: "All", count: 0 },
  { key: "new", label: "New", count: 0 },
  { key: "processing", label: "Processing", count: 0 },
  { key: "completed", label: "Completed", count: 0 },
  { key: "cancelled", label: "Cancelled", count: 0 },
]

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const contentWidth = Math.min(width, 480)
  const [active, setActive] = useState("all")

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
              <Text style={styles.title}>Orders</Text>
              <Text style={styles.subtitle}>
                Manage and track all your orders
              </Text>
            </View>
            <Pressable style={styles.searchBtn}>
              <Ionicons name="search" size={20} color={COLORS.primary} />
            </Pressable>
            <View style={styles.newOrderWrap}>
              <Pressable style={styles.newOrderBtn}>
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.newOrderText}>New Order</Text>
            </View>
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

          {/* Empty state */}
          <View style={styles.empty}>
            <View style={styles.illustration}>
              <View style={styles.blob} />
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={72}
                color={COLORS.primary}
                style={{ opacity: 0.55 }}
              />
              <Feather
                name="zap"
                size={0}
              />
            </View>
            <Text style={styles.emptyTitle}>No orders here</Text>
            <Text style={styles.emptySub}>
              Create your first order to see it here.
            </Text>

            <Pressable style={styles.createBtn}>
              <View style={styles.createPlus}>
                <Ionicons name="add" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.createText}>Create First Order</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Feature highlights */}
          <View style={styles.featureRow}>
            <Feature
              tint={COLORS.mintSoft}
              icon={
                <Feather name="shopping-cart" size={20} color={COLORS.primary} />
              }
              label={"Create orders\nin seconds"}
            />
            <View style={styles.divider} />
            <Feature
              tint={COLORS.blueSoft}
              icon={
                <Feather name="file-text" size={20} color={COLORS.blue} />
              }
              label={"Track order\nstatus easily"}
            />
            <View style={styles.divider} />
            <Feature
              tint={COLORS.amberSoft}
              icon={
                <Feather name="truck" size={20} color={COLORS.amber} />
              }
              label={"Serve your\ncustomers better"}
            />
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
        <TabItem icon="bag-handle" label="Orders" active />
        <TabItem icon="people-outline" label="Customers" />
        <TabItem icon="menu-outline" label="More" />
      </View>
    </View>
  )
}

function Feature({
  tint,
  icon,
  label,
}: {
  tint: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: tint }]}>
        {icon}
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: { fontSize: 30, fontWeight: "800", color: COLORS.ink },
  subtitle: { fontSize: 13, color: COLORS.inkSoft, marginTop: 3 },
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.mintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  newOrderWrap: { alignItems: "center", gap: 4 },
  newOrderBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  newOrderText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },

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

  // empty
  empty: { alignItems: "center", marginTop: 28, gap: 10 },
  illustration: {
    width: 190,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  blob: {
    position: "absolute",
    width: 180,
    height: 130,
    borderRadius: 70,
    backgroundColor: COLORS.mintSoft,
  },
  emptyTitle: { fontSize: 24, fontWeight: "800", color: COLORS.ink },
  emptySub: { fontSize: 15, color: COLORS.inkSoft, textAlign: "center" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginTop: 14,
  },
  createPlus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  createText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },

  // features
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 20,
  },
  feature: { flex: 1, alignItems: "center", gap: 10, paddingHorizontal: 4 },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
    lineHeight: 18,
  },
  divider: { width: 1, height: 60, backgroundColor: COLORS.line, marginTop: 6 },

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
