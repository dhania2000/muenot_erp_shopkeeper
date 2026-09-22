import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors } from '@/constants/theme';
import { Avatar, OrderCard, ProductCard } from './common';
import { Badge, Button, Card, Icon } from './ui';
import { Header, Screen, SectionTitle } from './screen';
import { ErrorState, Loading, UnavailableNote } from './states';
import { useArchiveCustomer, useCustomer, useOrder, useProduct, useTemplates, useUpdateOrder } from '@/features/queries';
import { errorMessage } from '@/services/api/errors';
import type { OrderStatus } from '@/types/domain';

/* --------------------------------------------------------- customer ----- */

export function CustomerDetail({ id }: { id: string }) {
  const { customer, orders, isPending, isError, error, refetch, ordersPending } = useCustomer(id);
  const archive = useArchiveCustomer();

  if (isPending) return <Shell title="Customer Details"><Loading /></Shell>;
  if (isError || !customer) return <Shell title="Customer Details"><ErrorState error={error} onRetry={refetch} /></Shell>;

  const confirmArchive = () =>
    Alert.alert(
      'Archive customer',
      `${customer.name} will stop appearing in your customer list. Their orders and WhatsApp history are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () =>
            archive.mutate(id, {
              onSuccess: () => router.replace('/customers'),
              onError: (e) => Alert.alert('Not archived', errorMessage(e)),
            }),
        },
      ],
    );

  return (
    <Screen>
      <Header title="Customer Details" />
      <View style={s.customer}>
        <Avatar name={customer.name} size={68} />
        <Text style={s.name}>{customer.name}</Text>
        <Text style={s.muted}>{customer.phone}</Text>
        {customer.archived && <Badge tone="warning">Archived</Badge>}
        <View style={s.tagRow}>
          {customer.tags.map((x) => (
            <Badge key={x}>{x}</Badge>
          ))}
        </View>
      </View>
      <View style={s.actionRow}>
        <Link href={`/orders/new?customer=${id}`} asChild>
          <Pressable style={s.action}>
            <Icon name="bag-outline" />
            <Text style={s.actionText}>Create Order</Text>
          </Pressable>
        </Link>
        <Link href={`/customers/${id}/edit`} asChild>
          <Pressable style={s.action}>
            <Icon name="pencil-outline" />
            <Text style={s.actionText}>Edit</Text>
          </Pressable>
        </Link>
        <Pressable style={s.action} onPress={confirmArchive} disabled={archive.isPending}>
          <Icon name="archive-outline" />
          <Text style={s.actionText}>Archive</Text>
        </Pressable>
      </View>
      <View style={s.pad}>
        {customer.email && (
          <Card style={s.info}>
            <Icon name="mail-outline" color={colors.muted} />
            <Text style={s.muted}>{customer.email}</Text>
          </Card>
        )}
        {(customer.city || customer.state) && (
          <Card style={s.info}>
            <Icon name="location-outline" color={colors.muted} />
            <Text style={s.muted}>{[customer.city, customer.state, customer.country].filter(Boolean).join(', ')}</Text>
          </Card>
        )}
        {customer.notes && (
          <Card style={s.info}>
            <Icon name="document-text-outline" color={colors.muted} />
            <Text style={s.muted}>{customer.notes}</Text>
          </Card>
        )}
        <View style={s.metrics}>
          <Card style={s.metric}>
            <Text style={s.metricVal}>{ordersPending ? '—' : (customer.orderCount ?? 0)}</Text>
            <Text style={s.muted}>Total Orders</Text>
          </Card>
          <Card style={s.metric}>
            <Text style={s.metricVal}>
              {ordersPending ? '—' : `₹${(customer.totalSpend ?? 0).toLocaleString('en-IN')}`}
            </Text>
            <Text style={s.muted}>Total Spend</Text>
          </Card>
        </View>
        <SectionTitle>Orders</SectionTitle>
        {ordersPending ? (
          <Loading label="Loading orders…" />
        ) : orders.length === 0 ? (
          <Text style={s.muted}>No orders for this customer yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {orders.map((x) => (
              <OrderCard key={x.id} order={x} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------ order ----- */

const ORDER_STATUSES: OrderStatus[] = ['new', 'processing', 'completed', 'cancelled'];

export function OrderDetail({ id }: { id: string }) {
  const { order, isPending, isError, error, refetch } = useOrder(id);
  const update = useUpdateOrder(id);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  if (isPending) return <Shell title="Order"><Loading /></Shell>;
  if (isError || !order) return <Shell title="Order"><ErrorState error={error} onRetry={refetch} /></Shell>;

  const setStatus = (status: OrderStatus) => {
    if (status === order.status || update.isPending) return;
    setPendingStatus(status);
    // The badge only moves after PATCH /orders/{id} confirms the change.
    update.mutate(
      { status },
      {
        onError: (e) => Alert.alert('Not updated', errorMessage(e)),
        onSettled: () => setPendingStatus(null),
      },
    );
  };

  const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <Screen>
      <Header title={order.number} subtitle={order.date} />
      <View style={s.pad}>
        <View style={s.row}>
          <View>
            <Text style={s.name}>{order.customerName}</Text>
            {order.customerPhone && <Text style={s.muted}>{order.customerPhone}</Text>}
          </View>
          <Badge
            tone={
              order.status === 'completed'
                ? 'success'
                : order.status === 'cancelled'
                  ? 'danger'
                  : order.status === 'processing'
                    ? 'warning'
                    : 'info'
            }
          >
            {order.status}
          </Badge>
        </View>

        <View style={s.rowStart}>
          <Badge tone={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'cod' ? 'info' : 'warning'}>
            {order.paymentStatus === 'cod' ? 'Cash on delivery' : order.paymentStatus}
          </Badge>
          <Badge>{order.deliveryMethod === 'delivery' ? 'Home delivery' : 'Shop pickup'}</Badge>
        </View>

        <View style={s.gap}>
          {order.items.map((x, index) => (
            <Card key={`${x.productId ?? 'free'}-${index}`} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{x.name}</Text>
                <Text style={s.muted}>
                  Qty {x.quantity} × {money(x.price)}
                </Text>
              </View>
              <Text style={s.name}>{money(x.quantity * x.price)}</Text>
            </Card>
          ))}
        </View>

        <View style={s.total}>
          <Text style={s.muted}>Subtotal</Text>
          <Text style={s.muted}>{money(order.subtotal)}</Text>
          {order.discount > 0 && (
            <>
              <Text style={s.muted}>Discount</Text>
              <Text style={s.muted}>-{money(order.discount)}</Text>
            </>
          )}
          <Text style={s.name}>Total</Text>
          <Text style={s.name}>{money(order.total)}</Text>
        </View>

        {order.deliveryAddress && (
          <Card style={s.info}>
            <Icon name="location-outline" color={colors.muted} />
            <Text style={s.muted}>{order.deliveryAddress}</Text>
          </Card>
        )}
        {order.notes && (
          <Card style={s.info}>
            <Icon name="document-text-outline" color={colors.muted} />
            <Text style={s.muted}>{order.notes}</Text>
          </Card>
        )}

        {order.conversationId && (
          <Link href={`/inbox/${order.conversationId}`} asChild>
            <Pressable>
              <Card style={s.info}>
                <Icon name="logo-whatsapp" />
                <Text style={[s.name, { flex: 1 }]}>Open WhatsApp chat</Text>
                <Icon name="chevron-forward" size={18} color={colors.muted} />
              </Card>
            </Pressable>
          </Link>
        )}

        <SectionTitle>Update Status</SectionTitle>
        <View style={s.choices}>
          {ORDER_STATUSES.map((x) => (
            <Pressable
              key={x}
              disabled={update.isPending}
              onPress={() => setStatus(x)}
              style={[s.choice, order.status === x && s.choiceActive, update.isPending && s.choiceBusy]}
            >
              <Text style={[s.choiceText, order.status === x && { color: '#fff' }]}>
                {pendingStatus === x ? 'Saving…' : x}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

/* ---------------------------------------------------------- product ----- */

export function ProductDetail({ id }: { id: string }) {
  const { product, isPending, isError, error, refetch } = useProduct(id);

  if (isPending) return <Shell title="Product Details"><Loading /></Shell>;
  if (isError || !product) return <Shell title="Product Details"><ErrorState error={error} onRetry={refetch} /></Shell>;

  return (
    <Screen>
      <Header
        title="Product Details"
        action={
          <Link href={`/more/products/${id}/edit`} asChild>
            <Pressable style={s.headAction} accessibilityLabel="Edit product">
              <Icon name="pencil-outline" />
            </Pressable>
          </Link>
        }
      />
      <View style={s.pad}>
        <ProductCard product={product} />
        <View style={s.gap}>
          <Text style={s.name}>{product.name}</Text>
          <View style={s.rowStart}>
            <Badge tone={product.stock === 'in-stock' ? 'success' : product.stock === 'low-stock' ? 'warning' : 'danger'}>
              {product.stock.replace('-', ' ')}
            </Badge>
            {!product.active && <Badge tone="neutral">Inactive</Badge>}
            {product.stockQuantity != null && <Badge>{product.stockQuantity} in stock</Badge>}
          </View>
          <Text style={s.price}>₹{(product.offerPrice ?? product.price).toLocaleString('en-IN')}</Text>
          {product.offerPrice != null && <Text style={s.strike}>₹{product.price.toLocaleString('en-IN')}</Text>}
          <Text style={s.muted}>
            {[product.sku && `SKU: ${product.sku}`, product.category].filter(Boolean).join(' · ') || 'No SKU or category'}
          </Text>
          {product.description && (
            <Card>
              <Text style={s.name}>Description</Text>
              <Text style={s.muted}>{product.description}</Text>
            </Card>
          )}
        </View>
      </View>
    </Screen>
  );
}

/* --------------------------------------------------------- template ----- */

export function TemplateDetail({ id }: { id: string }) {
  const { templates, isPending, isError, error, refetch } = useTemplates();
  const template = templates.find((x) => x.id === id);

  if (isPending) return <Shell title="Template Details"><Loading /></Shell>;
  if (isError) return <Shell title="Template Details"><ErrorState error={error} onRetry={refetch} /></Shell>;
  if (!template) return <Shell title="Template Details"><ErrorState error={undefined} /></Shell>;

  return (
    <Screen>
      <Header title="Template Details" />
      <View style={s.pad}>
        <View style={s.row}>
          <Text style={[s.name, { flex: 1 }]}>{template.name}</Text>
          <Badge
            tone={
              template.status === 'approved'
                ? 'success'
                : template.status === 'pending'
                  ? 'warning'
                  : template.status === 'rejected'
                    ? 'danger'
                    : 'neutral'
            }
          >
            {template.rawStatus}
          </Badge>
        </View>
        <View style={s.tagRow}>
          {!!template.category && <Badge>{template.category}</Badge>}
          <Badge>{template.language}</Badge>
        </View>
        {template.rejectedReason && <UnavailableNote>Meta's reason: {template.rejectedReason}</UnavailableNote>}
        <Card style={s.gap}>
          <Text style={s.muted}>Message Preview</Text>
          <View style={s.preview}>
            <Text style={s.messageText}>{template.body || 'This template has no body text.'}</Text>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Screen scroll={false}>
      <Header title={title} />
      {children}
    </Screen>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, gap: 15 },
  customer: { alignItems: 'center', gap: 6, padding: 22 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  rowStart: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  action: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 12, alignItems: 'center', gap: 5 },
  actionText: { fontSize: 11, fontWeight: '700', color: colors.text },
  info: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, alignItems: 'center' },
  metricVal: { fontSize: 18, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  gap: { gap: 10 },
  total: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 7 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { paddingVertical: 9, paddingHorizontal: 11, borderRadius: 12, backgroundColor: '#edf1ef' },
  choiceActive: { backgroundColor: colors.primary },
  choiceBusy: { opacity: 0.6 },
  choiceText: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'capitalize' },
  messageText: { fontSize: 14, color: colors.text, lineHeight: 19 },
  preview: { padding: 12, borderRadius: 12, backgroundColor: '#eef2f0' },
  headAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: 24, fontWeight: '800', color: colors.text },
  strike: { fontSize: 14, color: colors.muted, textDecorationLine: 'line-through' },
});
