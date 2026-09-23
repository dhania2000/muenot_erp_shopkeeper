import { useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
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
  amber: "#F3C08B",
  amberSoft: "#FBE7CF",
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const contentWidth = useMemo(() => Math.min(width, 480), [width])

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { width: contentWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image
                source={require("../assets/muenot-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.brandName}>Muenot Shopkeeper</Text>
                <Text style={styles.brandTag}>SELL • MANAGE • GROW</Text>
              </View>
            </View>

            <Pressable style={styles.langPill}>
              <Text style={styles.langText}>EN</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.ink} />
            </Pressable>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                Run your business{" "}
                <Text style={styles.heroTitleAccent}>from your phone</Text>
              </Text>
              <Text style={styles.heroSub}>
                Manage WhatsApp, customers, orders, products and business
                communication — all from one simple app.
              </Text>

              <View style={styles.scriptWrap}>
                <Text style={styles.scriptText}>Business Made Simple</Text>
                <View style={styles.scriptUnderline} />
              </View>
            </View>

            <PhoneMockup />
          </View>

          {/* Feature grid */}
          <View style={styles.grid}>
            <FeatureCard
              icon={
                <FontAwesome5 name="whatsapp" size={22} color={COLORS.primary} />
              }
              title="WhatsApp conversations"
              subtitle="Chat, broadcast and manage leads"
            />
            <FeatureCard
              icon={
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color={COLORS.primary}
                />
              }
              title="Customers & relationships"
              subtitle="Keep your customers close"
            />
            <FeatureCard
              icon={
                <Feather name="shopping-bag" size={22} color={COLORS.primary} />
              }
              title="Orders, start to finish"
              subtitle="Create, track and deliver orders"
            />
            <FeatureCard
              icon={
                <Feather name="box" size={22} color={COLORS.primary} />
              }
              title="Products & inventory"
              subtitle="Manage stock with ease"
            />
          </View>

          {/* Actions */}
          <Pressable style={styles.loginBtn} onPress={() => router.push("/dashboard")}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>Login</Text>
              <View style={styles.loginArrow}>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.getStartedBtn}>
            <Text style={styles.getStartedText}>Get Started</Text>
            <View style={styles.getStartedArrow}>
              <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
            </View>
          </Pressable>

          {/* Footer badges */}
          <View style={styles.footer}>
            <FooterBadge
              icon={
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={COLORS.primary}
                />
              }
              label="Secure & Reliable"
            />
            <FooterBadge
              icon={
                <Ionicons name="flash" size={20} color={COLORS.primary} />
              }
              label="Built for Businesses"
            />
            <FooterBadge
              icon={
                <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
              }
              label="Trusted by Thousands"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function FeatureCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <Pressable style={styles.featureCard}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureBody}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
    </Pressable>
  )
}

function FooterBadge({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <View style={styles.footerBadge}>
      {icon}
      <Text style={styles.footerText}>{label}</Text>
    </View>
  )
}

function PhoneMockup() {
  return (
    <View style={styles.phoneWrap}>
      <View style={styles.phone}>
        {/* status row */}
        <View style={styles.phoneTop}>
          <Ionicons name="chevron-back" size={14} color={COLORS.ink} />
          <View style={styles.phoneTopRight}>
            <Ionicons name="notifications-outline" size={14} color={COLORS.ink} />
            <View style={styles.avatar} />
          </View>
        </View>

        <Text style={styles.greeting}>Good Morning</Text>
        <Text style={styles.greetingSub}>Your business, smarter today</Text>

        {/* sales card */}
        <View style={styles.salesCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.salesLabel}>Total Sales</Text>
            <Text style={styles.salesValue}>₹48,320</Text>
            <Text style={styles.salesUp}>↑ +12%</Text>
          </View>
          <View style={styles.bars}>
            {[10, 14, 9, 18, 13, 22].map((h, i) => (
              <View key={i} style={[styles.bar, { height: h }]} />
            ))}
          </View>
        </View>

        {/* stat grid */}
        <View style={styles.statGrid}>
          <StatTile
            tint={COLORS.amberSoft}
            icon={<Feather name="box" size={14} color="#C6803A" />}
            label="Orders"
            value="24"
          />
          <StatTile
            tint={COLORS.mintSoft}
            icon={
              <MaterialCommunityIcons
                name="account-group"
                size={16}
                color={COLORS.primary}
              />
            }
            label="Customers"
            value="356"
          />
          <StatTile
            tint={COLORS.amberSoft}
            icon={<Feather name="box" size={14} color="#C6803A" />}
            label="Products"
            value="1,240"
          />
          <StatTile
            tint={COLORS.mintSoft}
            icon={<FontAwesome5 name="whatsapp" size={14} color={COLORS.primary} />}
            label="New Leads"
            value="18"
          />
        </View>

        {/* bottom nav */}
        <View style={styles.phoneNav}>
          <NavItem icon="home" label="Home" active />
          <NavItem icon="bag-outline" label="Orders" />
          <NavItem icon="chatbubble-outline" label="Chat" />
          <NavItem icon="ellipsis-horizontal" label="More" />
        </View>
      </View>

      {/* floating whatsapp */}
      <View style={styles.floatWa}>
        <FontAwesome5 name="whatsapp" size={22} color="#FFFFFF" />
      </View>

      {/* floating note */}
      <View style={styles.floatNote}>
        <Text style={styles.floatNoteText}>Chat</Text>
        <Text style={styles.floatNoteText}>Sell</Text>
        <Text style={styles.floatNoteText}>Grow</Text>
      </View>
    </View>
  )
}

function StatTile({
  tint,
  icon,
  label,
  value,
}: {
  tint: string
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active?: boolean
}) {
  return (
    <View style={styles.navItem}>
      <Ionicons
        name={icon}
        size={16}
        color={active ? COLORS.primary : COLORS.inkSoft}
      />
      <Text style={[styles.navLabel, active && { color: COLORS.primary }]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { alignItems: "center", paddingHorizontal: 20 },
  container: { gap: 22 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 48,
    height: 48,
  },
  brandName: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  brandTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  langText: { fontSize: 14, fontWeight: "700", color: COLORS.ink },

  hero: { flexDirection: "row", gap: 12 },
  heroCopy: { flex: 1, justifyContent: "flex-start" },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  heroTitleAccent: { color: COLORS.primary },
  heroSub: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.inkSoft,
  },
  scriptWrap: { marginTop: 22, alignSelf: "flex-start" },
  scriptText: {
    fontSize: 26,
    fontStyle: "italic",
    fontWeight: "600",
    color: COLORS.ink,
  },
  scriptUnderline: {
    marginTop: 4,
    height: 3,
    borderRadius: 3,
    width: "70%",
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },

  // phone
  phoneWrap: { width: 150, position: "relative" },
  phone: {
    backgroundColor: COLORS.card,
    borderRadius: 26,
    padding: 10,
    borderWidth: 4,
    borderColor: "#DCE4DD",
    gap: 6,
  },
  phoneTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phoneTopRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2B2B2B",
  },
  greeting: { fontSize: 12, fontWeight: "800", color: COLORS.ink },
  greetingSub: { fontSize: 8, color: COLORS.inkSoft },
  salesCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.mintSoft,
    borderRadius: 12,
    padding: 8,
  },
  salesLabel: { fontSize: 7, color: COLORS.inkSoft },
  salesValue: { fontSize: 14, fontWeight: "800", color: COLORS.ink },
  salesUp: { fontSize: 7, fontWeight: "700", color: COLORS.primary },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 24 },
  bar: { width: 3, borderRadius: 2, backgroundColor: COLORS.primary },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statTile: {
    width: "47%",
    backgroundColor: "#F7FAF8",
    borderRadius: 10,
    padding: 8,
    gap: 3,
  },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 7, color: COLORS.inkSoft },
  statValue: { fontSize: 12, fontWeight: "800", color: COLORS.ink },
  phoneNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 6,
    marginTop: 2,
  },
  navItem: { alignItems: "center", gap: 2 },
  navLabel: { fontSize: 6, color: COLORS.inkSoft },
  floatWa: {
    position: "absolute",
    top: 90,
    left: -18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  floatNote: {
    position: "absolute",
    top: 70,
    right: -12,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  floatNoteText: {
    fontSize: 10,
    fontStyle: "italic",
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },

  // features
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  featureCard: {
    width: "48.5%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#0E1A12",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  featureBody: { flex: 1 },
  featureTitle: { fontSize: 13, fontWeight: "800", color: COLORS.ink },
  featureSub: { fontSize: 11, color: COLORS.inkSoft, marginTop: 3 },

  // actions
  loginBtn: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  loginGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  loginText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  loginArrow: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  getStartedText: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  getStartedArrow: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.mintSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  // footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footerBadge: { flex: 1, alignItems: "center", gap: 6 },
  footerText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.inkSoft,
    textAlign: "center",
  },
})
