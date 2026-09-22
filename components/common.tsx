import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@/constants/theme';
import { Icon, Badge, Card } from './ui';
import type { Conversation, Customer, Order, Product } from '@/types/domain';

const initials = (name: string) =>
  name
    .split(' ')
    .map((x) => x[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const palette = [colors.primary, colors.info, colors.warning, '#9c7155'];
  const label = initials(name || '?') || '?';
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: palette[(name?.length ?? 0) % palette.length] }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.32 }]}>{label}</Text>
    </View>
  );
}

const orderTone = (status: Order['status']) =>
  status === 'completed' ? 'success' : status === 'processing' ? 'warning' : status === 'cancelled' ? 'danger' : 'info';

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/orders/${order.id}`} asChild>
      <Pressable style={s.card}>
        <View style={s.row}>
          <Text style={s.bold}>{order.number}</Text>
          <Badge tone={orderTone(order.status)}>{order.status[0].toUpperCase() + order.status.slice(1)}</Badge>
        </View>
        <Text style={s.muted} numberOfLines={1}>
          {order.customerName}
        </Text>
        <View style={s.row}>
          <Text style={s.small}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            {order.date ? ` · ${order.date}` : ''}
          </Text>
          <Text style={s.bold}>₹{order.total.toLocaleString('en-IN')}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export function ConversationCard({ conversation }: { conversation: Conversation }) {
  return (
    <Link href={`/inbox/${conversation.id}`} asChild>
      <Pressable style={s.list}>
        <Avatar name={conversation.customer.name} />
        <View style={s.flex}>
          <View style={s.row}>
            <Text style={s.medium} numberOfLines={1}>
              {conversation.customer.name}
            </Text>
            <Text style={s.tiny}>{conversation.time}</Text>
          </View>
          <Text numberOfLines={1} style={[s.muted, conversation.unreadCount > 0 && s.medium]}>
            {conversation.lastMessage}
          </Text>
          {conversation.tags.length > 0 && (
            <View style={s.tags}>
              {conversation.tags.map((x) => (
                <Badge key={x}>{x}</Badge>
              ))}
            </View>
          )}
        </View>
        {conversation.unreadCount > 0 && (
          <View style={s.unread}>
            <Text style={s.unreadText}>{conversation.unreadCount}</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Link href={`/customers/${customer.id}`} asChild>
      <Pressable style={s.list}>
        <Avatar name={customer.name} />
        <View style={s.flex}>
          <Text style={s.medium} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={s.muted}>{customer.phone}</Text>
          <View style={s.tags}>
            {customer.tags.slice(0, 2).map((x) => (
              <Badge key={x}>{x}</Badge>
            ))}
            {/* Order counts are not on the contact record, so a list row only
                shows the last interaction the API does return. */}
            {!!customer.lastInteraction && <Text style={s.tiny}>{customer.lastInteraction}</Text>}
          </View>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    </Link>
  );
}

const PRODUCT_PLACEHOLDER = require('@/assets/images/products/rice-bag.png');

export function ProductCard({ product }: { product: Product }) {
  const tone = product.stock === 'in-stock' ? 'success' : product.stock === 'low-stock' ? 'warning' : 'danger';
  // imageUrl is a remote URL from the API, or a local file: URI while a newly
  // picked photo is on screen; anything else falls back to the placeholder.
  const source = product.imageUrl && /^(https?|file|data):/.test(product.imageUrl) ? { uri: product.imageUrl } : PRODUCT_PLACEHOLDER;
  return (
    <Link href={`/more/products/${product.id}`} asChild>
      <Pressable style={s.cardRow}>
        <Image source={source} style={s.productImage} />
        <View style={s.flex}>
          <Text style={s.medium} numberOfLines={2}>
            {product.name}
          </Text>
          {!!product.sku && <Text style={s.tiny}>{product.sku}</Text>}
          <View style={s.row}>
            <Text style={s.bold}>₹{(product.offerPrice ?? product.price).toLocaleString('en-IN')}</Text>
            <Badge tone={tone}>{product.stock.replace('-', ' ')}</Badge>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export function MenuItem({ href, label, icon }: { href: string; label: string; icon: any }) {
  return (
    <Link href={href as any} asChild>
      <Pressable style={s.menu}>
        <View style={s.iconSoft}>
          <Icon name={icon} />
        </View>
        <Text style={[s.medium, s.flex]}>{label}</Text>
        <Icon name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    </Link>
  );
}

export function Metric({ label, value, icon, tone = colors.primary }: { label: string; value: string; icon: any; tone?: string }) {
  return (
    <Card style={s.metric}>
      <View style={[s.metricIcon, { backgroundColor: tone + '20' }]}>
        <Icon name={icon} size={17} color={tone} />
      </View>
      <Text style={s.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.tiny}>{label}</Text>
    </Card>
  );
}

const s = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1, minWidth: 0, gap: 3 },
  bold: { fontSize: 14, fontWeight: '800', color: colors.text },
  medium: { fontSize: 14, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  small: { fontSize: 12, color: colors.muted },
  tiny: { fontSize: 11, color: colors.muted },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 14, gap: 9 },
  list: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' },
  unread: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  cardRow: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 12, gap: 12, flexDirection: 'row' },
  productImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#edf1ef' },
  menu: { padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconSoft: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  metric: { width: '48%', gap: 8 },
  metricIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 18, fontWeight: '800', color: colors.text },
});
