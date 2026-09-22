import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header, Screen } from '@/components/screen';
import { Avatar } from '@/components/common';
import { Button, Icon, Input } from '@/components/ui';
import { ErrorState, Loading } from '@/components/states';
import { colors } from '@/constants/theme';
import { useConversation, useCreateOrder, useCustomers, useProducts } from '@/features/queries';
import { useDebounced } from '@/features/use-debounced';
import { orderSubtotal } from '@/features/metrics';
import { errorMessage, isApiError } from '@/services/api/errors';
import type { ApiPaymentStatus, OrderInput } from '@/types/api';
import type { DeliveryMethod } from '@/types/domain';

const steps = ['Customer', 'Products', 'Payment', 'Delivery', 'Review'];

const PAYMENTS: { label: string; value: ApiPaymentStatus }[] = [
  { label: 'Cash on Delivery', value: 'cod' },
  { label: 'Already Paid', value: 'paid' },
  { label: 'Payment Pending', value: 'pending' },
];
const DELIVERIES: { label: string; value: DeliveryMethod }[] = [
  { label: 'Shop Pickup', value: 'pickup' },
  { label: 'Home Delivery', value: 'delivery' },
];

/**
 * Create order (POST /orders).
 *
 * Reached three ways: blank, `?customer=<contactId>`, or
 * `?conversation=<id>` from a WhatsApp chat. With a conversation the backend
 * resolves the customer itself, so the customer step is skipped — the app
 * never has to guess who the chat belongs to.
 */
export default function NewOrder() {
  const params = useLocalSearchParams<{ customer?: string; conversation?: string }>();
  const conversationId = params.conversation;
  const fromConversation = !!conversationId;

  const [step, setStep] = useState(fromConversation ? 1 : 0);
  const [contactId, setContactId] = useState(params.customer ?? '');
  const [cart, setCart] = useState<{ id: string; q: number }[]>([]);
  const [payment, setPayment] = useState<ApiPaymentStatus | ''>('');
  const [delivery, setDelivery] = useState<DeliveryMethod | ''>('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const debouncedCustomer = useDebounced(customerSearch, 350);
  const debouncedProduct = useDebounced(productSearch, 350);

  const customers = useCustomers({ search: debouncedCustomer.trim() || undefined });
  const productList = useProducts({ search: debouncedProduct.trim() || undefined });
  const conversation = useConversation(fromConversation ? conversationId : undefined);
  const createOrder = useCreateOrder();

  const selectedCustomer = customers.customers.find((x) => x.id === contactId);
  const chatCustomer = conversation.conversation?.customer;

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          const product = productList.products.find((p) => p.id === line.id);
          return product ? { product, quantity: line.q } : null;
        })
        .filter(Boolean) as { product: (typeof productList.products)[number]; quantity: number }[],
    [cart, productList.products],
  );

  const total = orderSubtotal(
    lines.map((l) => ({ productId: l.product.id, name: l.product.name, quantity: l.quantity, price: l.product.offerPrice ?? l.product.price })),
  );

  const good =
    step === 0
      ? !!contactId
      : step === 1
        ? cart.length > 0
        : step === 2
          ? !!payment
          : step === 3
            ? !!delivery && (delivery !== 'delivery' || address.trim().length > 3)
            : true;

  const update = (id: string, delta: number) =>
    setCart((prev) => {
      const line = prev.find((x) => x.id === id);
      if (!line) return delta > 0 ? [...prev, { id, q: 1 }] : prev;
      return line.q + delta <= 0 ? prev.filter((x) => x.id !== id) : prev.map((x) => (x.id === id ? { ...x, q: x.q + delta } : x));
    });

  const submit = () => {
    if (createOrder.isPending) return;
    const payload: OrderInput = {
      // Exactly one of these is sent; the backend resolves the customer from
      // the conversation when that is what we have.
      ...(fromConversation ? { conversationId: Number(conversationId) } : { contactId: Number(contactId) }),
      items: lines.map((l) => ({ productId: Number(l.product.id), quantity: l.quantity })),
      paymentStatus: payment || 'pending',
      deliveryMethod: delivery === 'delivery' ? 'home_delivery' : 'shop_pickup',
      deliveryAddress: delivery === 'delivery' ? address.trim() : undefined,
      notes: notes.trim() || undefined,
    };
    createOrder.mutate(payload, {
      // Navigation happens only after the backend has created the order, so
      // the detail screen it lands on is a real record.
      onSuccess: (result) => router.replace(`/orders/${result.order.id}`),
      onError: (error) => {
        const detail = isApiError(error) && error.fields ? Object.values(error.fields).join('\n') : errorMessage(error);
        Alert.alert('Order not created', detail);
      },
    });
  };

  const back = () => setStep((s) => Math.max(fromConversation ? 1 : 0, s - 1));

  return (
    <Screen scroll={false}>
      <Header title="New Order" subtitle={`Step ${step + 1} of 5 · ${steps[step]}`} />
      <View style={s.body}>
        {step === 0 && (
          <>
            <Input placeholder="Search customers" value={customerSearch} onChangeText={setCustomerSearch} autoCapitalize="none" />
            {customers.isPending ? (
              <Loading label="Loading customers…" />
            ) : customers.error ? (
              <ErrorState error={customers.error} onRetry={customers.refetch} />
            ) : (
              <FlatList
                style={s.grow}
                data={customers.customers}
                keyExtractor={(x) => x.id}
                onEndReached={() => customers.hasNextPage && !customers.isFetchingNextPage && customers.fetchNextPage()}
                onEndReachedThreshold={0.4}
                ListEmptyComponent={<Text style={s.empty}>No customers found. Add one first.</Text>}
                renderItem={({ item }) => (
                  <Pressable onPress={() => setContactId(item.id)} style={[s.item, contactId === item.id && s.selected]}>
                    <Avatar name={item.name} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.name}>{item.name}</Text>
                      <Text style={s.muted}>{item.phone}</Text>
                    </View>
                    {contactId === item.id && <Icon name="checkmark-circle" />}
                  </Pressable>
                )}
              />
            )}
          </>
        )}

        {step === 1 && (
          <>
            {fromConversation && chatCustomer && (
              <View style={s.chip}>
                <Icon name="logo-whatsapp" size={16} />
                <Text style={s.chipText}>Order for {chatCustomer.name}</Text>
              </View>
            )}
            <Input placeholder="Search products" value={productSearch} onChangeText={setProductSearch} autoCapitalize="none" />
            {productList.isPending ? (
              <Loading label="Loading products…" />
            ) : productList.error ? (
              <ErrorState error={productList.error} onRetry={productList.refetch} />
            ) : (
              <FlatList
                style={s.grow}
                data={productList.products}
                keyExtractor={(x) => x.id}
                onEndReached={() => productList.hasNextPage && !productList.isFetchingNextPage && productList.fetchNextPage()}
                onEndReachedThreshold={0.4}
                ListEmptyComponent={<Text style={s.empty}>No products found. Add one first.</Text>}
                renderItem={({ item }) => {
                  const line = cart.find((x) => x.id === item.id);
                  return (
                    <View style={s.item}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.name}>{item.name}</Text>
                        <Text style={s.muted}>
                          ₹{(item.offerPrice ?? item.price).toLocaleString('en-IN')}
                          {item.stock === 'out-of-stock' ? ' · Out of stock' : ''}
                        </Text>
                      </View>
                      {line ? (
                        <View style={s.qty}>
                          <Pressable onPress={() => update(item.id, -1)} hitSlop={8}>
                            <Icon name="remove-circle-outline" />
                          </Pressable>
                          <Text style={s.name}>{line.q}</Text>
                          <Pressable onPress={() => update(item.id, 1)} hitSlop={8}>
                            <Icon name="add-circle" />
                          </Pressable>
                        </View>
                      ) : (
                        <Button title="Add" variant="outline" onPress={() => update(item.id, 1)} />
                      )}
                    </View>
                  );
                }}
              />
            )}
          </>
        )}

        {step === 2 &&
          PAYMENTS.map((x) => (
            <Choice key={x.value} label={x.label} selected={payment === x.value} onPress={() => setPayment(x.value)} />
          ))}

        {step === 3 && (
          <>
            {DELIVERIES.map((x) => (
              <Choice key={x.value} label={x.label} selected={delivery === x.value} onPress={() => setDelivery(x.value)} />
            ))}
            {delivery === 'delivery' && (
              <Input label="Delivery Address" multiline value={address} onChangeText={setAddress} placeholder="House no., street, landmark" />
            )}
          </>
        )}

        {step === 4 && (
          <View style={{ gap: 12 }}>
            <View style={s.review}>
              <Text style={s.muted}>Customer</Text>
              <Text style={s.name}>{fromConversation ? (chatCustomer?.name ?? 'From WhatsApp chat') : (selectedCustomer?.name ?? '—')}</Text>
            </View>
            <View style={s.review}>
              <Text style={s.muted}>Items</Text>
              {lines.map((l) => (
                <Text key={l.product.id} style={s.name}>
                  {l.product.name} × {l.quantity}
                </Text>
              ))}
            </View>
            <View style={s.review}>
              <Text style={s.muted}>Payment</Text>
              <Text style={s.name}>{PAYMENTS.find((p) => p.value === payment)?.label}</Text>
              <Text style={s.muted}>Delivery</Text>
              <Text style={s.name}>{DELIVERIES.find((d) => d.value === delivery)?.label}</Text>
              {!!address.trim() && <Text style={s.muted}>{address.trim()}</Text>}
            </View>
            <Input label="Notes (optional)" multiline value={notes} onChangeText={setNotes} placeholder="Anything to remember about this order" />
          </View>
        )}
      </View>

      <View style={s.footer}>
        <View style={s.total}>
          <Text style={s.muted}>Total</Text>
          <Text style={s.big}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
        <View style={s.footerButtons}>
          {step > (fromConversation ? 1 : 0) && (
            <View style={s.half}>
              <Button title="Back" variant="outline" onPress={back} />
            </View>
          )}
          <View style={s.half}>
            <Button
              title={step === 4 ? 'Create Order' : 'Continue'}
              disabled={!good}
              loading={createOrder.isPending}
              onPress={() => (step === 4 ? submit() : setStep(step + 1))}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.item, selected && s.selected]}>
      <Text style={[s.name, { flex: 1 }]}>{label}</Text>
      {selected && <Icon name="checkmark-circle" />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, padding: 16, gap: 10 },
  grow: { flex: 1 },
  item: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  name: { fontSize: 14, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  empty: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  qty: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  footerButtons: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  total: { flexDirection: 'row', justifyContent: 'space-between' },
  big: { fontSize: 21, fontWeight: '800', color: colors.text },
  review: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, gap: 5 },
});
