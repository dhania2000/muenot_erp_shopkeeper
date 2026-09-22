import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { Button, Input, Icon } from './ui';
import { Header, Screen } from './screen';
import { ErrorState, Loading, UnavailableNote } from './states';
import {
  useCreateCustomer,
  useCreateProduct,
  useCustomer,
  useDeleteProduct,
  useProduct,
  useUpdateCustomer,
  useUpdateProduct,
} from '@/features/queries';
import { isApiError } from '@/services/api/errors';
import { toApiStockStatus } from '@/features/mappers';
import type { ContactInput, ProductInput } from '@/types/api';
import type { StockLevel } from '@/types/domain';

/**
 * Create/edit forms.
 *
 * Validation is the backend's: a 422 comes back with a `fields` map, which is
 * rendered against the matching input. The local checks below only gate the
 * submit button so an obviously incomplete form is not sent.
 */

/** Pulls a field message out of a 422, or the whole message for anything else. */
function useFormError(error: unknown) {
  const apiError = isApiError(error) ? error : null;
  return {
    fieldError: (name: string) => apiError?.fields?.[name],
    banner: apiError && !apiError.fields ? apiError.message : null,
  };
}

function Banner({ message }: { message: string }) {
  return (
    <View style={s.banner}>
      <Icon name="alert-circle-outline" size={18} color={colors.danger} />
      <Text style={s.bannerText}>{message}</Text>
    </View>
  );
}

/* --------------------------------------------------------- customer ----- */

export function CustomerForm({ id }: { id?: string }) {
  const edit = !!id;
  const existing = useCustomer(edit ? id : undefined);
  const customer = existing.customer;

  if (edit && existing.isPending) {
    return (
      <Screen scroll={false}>
        <Header title="Edit Customer" />
        <Loading />
      </Screen>
    );
  }
  if (edit && (existing.isError || !customer)) {
    return (
      <Screen scroll={false}>
        <Header title="Edit Customer" />
        <ErrorState error={existing.error} onRetry={existing.refetch} />
      </Screen>
    );
  }
  return <CustomerFields key={customer?.id ?? 'new'} id={id} initial={customer} />;
}

function CustomerFields({ id, initial }: { id?: string; initial?: ReturnType<typeof useCustomer>['customer'] }) {
  const edit = !!id;
  const create = useCreateCustomer();
  const update = useUpdateCustomer(id ?? '');
  const mutation = edit ? update : create;
  const { fieldError, banner } = useFormError(mutation.error);

  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tag, setTag] = useState('');

  // The backend requires at least 6 digits and enforces uniqueness per tenant.
  const valid = phone.replace(/\D/g, '').length >= 6;

  const submit = () => {
    if (!valid || mutation.isPending) return;
    const payload: ContactInput = {
      name: name.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      tags,
    };
    mutation.mutate(payload as never, {
      onSuccess: (result: any) => {
        const savedId = String(result?.contact?.id ?? id);
        router.replace(edit ? `/customers/${savedId}` : '/customers');
      },
    });
  };

  const addTag = () => {
    const value = tag.trim();
    if (value && !tags.includes(value)) setTags([...tags, value]);
    setTag('');
  };

  return (
    <Screen keyboard>
      <Header title={edit ? 'Edit Customer' : 'Add Customer'} />
      <View style={s.form}>
        {banner && <Banner message={banner} />}
        <Input label="Name" placeholder="Full name" value={name} onChangeText={setName} error={fieldError('name')} />
        <Input
          label="Phone"
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          error={fieldError('phone')}
        />
        <Input
          label="Email"
          placeholder="customer@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          error={fieldError('email')}
        />
        <View style={s.pair}>
          <View style={s.half}>
            <Input label="City" value={city} onChangeText={setCity} error={fieldError('city')} />
          </View>
          <View style={s.half}>
            <Input label="State" value={state} onChangeText={setState} error={fieldError('state')} />
          </View>
        </View>
        <Input label="Tags" placeholder="e.g. VIP, Wholesale" value={tag} onChangeText={setTag} onSubmitEditing={addTag} />
        <View style={s.tags}>
          {tags.map((x) => (
            <Pressable key={x} style={s.tag} onPress={() => setTags(tags.filter((t) => t !== x))}>
              <Text style={s.tagText}>{x} ×</Text>
            </Pressable>
          ))}
        </View>
        <Input
          label="Notes"
          placeholder="Add any notes about this customer"
          multiline
          value={notes}
          onChangeText={setNotes}
          error={fieldError('notes')}
        />
        <Button
          title={edit ? 'Save Changes' : 'Add Customer'}
          disabled={!valid}
          loading={mutation.isPending}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}

/* ---------------------------------------------------------- product ----- */

const STOCK_OPTIONS: { value: StockLevel; label: string }[] = [
  { value: 'in-stock', label: 'In stock' },
  { value: 'low-stock', label: 'Low stock' },
  { value: 'out-of-stock', label: 'Out of stock' },
];

export function ProductForm({ id }: { id?: string }) {
  const edit = !!id;
  const existing = useProduct(edit ? id : undefined);

  if (edit && existing.isPending) {
    return (
      <Screen scroll={false}>
        <Header title="Edit Product" />
        <Loading />
      </Screen>
    );
  }
  if (edit && (existing.isError || !existing.product)) {
    return (
      <Screen scroll={false}>
        <Header title="Edit Product" />
        <ErrorState error={existing.error} onRetry={existing.refetch} />
      </Screen>
    );
  }
  return <ProductFields key={existing.product?.id ?? 'new'} id={id} initial={existing.product ?? undefined} />;
}

function ProductFields({ id, initial }: { id?: string; initial?: NonNullable<ReturnType<typeof useProduct>['product']> }) {
  const edit = !!id;
  const create = useCreateProduct();
  const update = useUpdateProduct(id ?? '');
  const remove = useDeleteProduct();
  const mutation = edit ? update : create;
  const { fieldError, banner } = useFormError(mutation.error);

  const [name, setName] = useState(initial?.name ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [offer, setOffer] = useState(initial?.offerPrice != null ? String(initial.offerPrice) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [stock, setStock] = useState<StockLevel>(initial?.stock ?? 'in-stock');
  const [active, setActive] = useState(initial?.active ?? true);
  const [localImage, setLocalImage] = useState<string | undefined>();

  // Only the name is required by the backend; price defaults to 0.
  const valid = name.trim().length > 1;

  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setLocalImage(result.assets[0].uri);
  }

  const submit = () => {
    if (!valid || mutation.isPending) return;
    const payload: ProductInput = {
      name: name.trim(),
      sku: sku.trim() || undefined,
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      price: price ? Number(price) : 0,
      offerPrice: offer ? Number(offer) : undefined,
      stockStatus: toApiStockStatus(stock),
      status: active ? 'active' : 'inactive',
    };
    mutation.mutate(payload as never, {
      onSuccess: (result: any) => {
        const savedId = String(result?.product?.id ?? id);
        router.replace(edit ? `/more/products/${savedId}` : '/more/products');
      },
    });
  };

  const confirmDelete = () =>
    Alert.alert('Delete product', `${initial?.name} will be removed from your catalogue. Past orders keep their own copy.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(id!, { onSuccess: () => router.replace('/more/products') }),
      },
    ]);

  const preview = localImage ?? initial?.imageUrl;

  return (
    <Screen keyboard>
      <Header title={edit ? 'Edit Product' : 'Add Product'} />
      <View style={s.form}>
        {banner && <Banner message={banner} />}
        <Pressable style={s.photo} onPress={pick}>
          {preview ? (
            <Image source={{ uri: preview }} style={s.photoImg} />
          ) : (
            <>
              <Icon name="camera-outline" size={28} />
              <Text style={s.photoText}>Add photo</Text>
            </>
          )}
        </Pressable>
        {localImage && (
          <UnavailableNote>
            The mobile API has no image upload endpoint, so this photo stays on your phone and is not saved with the
            product. Set a product image from Muenot ERP.
          </UnavailableNote>
        )}
        <Input label="Product Name" value={name} onChangeText={setName} placeholder="e.g. Basmati Rice 5kg" error={fieldError('name')} />
        <Input label="SKU" value={sku} onChangeText={setSku} placeholder="RIC-5KG-001" autoCapitalize="characters" error={fieldError('sku')} />
        <Input label="Category" value={category} onChangeText={setCategory} placeholder="Grocery" error={fieldError('category')} />
        <View style={s.pair}>
          <View style={s.half}>
            <Input label="Price (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="650" error={fieldError('price')} />
          </View>
          <View style={s.half}>
            <Input label="Offer Price (₹)" value={offer} onChangeText={setOffer} keyboardType="numeric" placeholder="599" error={fieldError('offerPrice')} />
          </View>
        </View>

        <Text style={s.label}>Stock</Text>
        <View style={s.choices}>
          {STOCK_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setStock(option.value)}
              style={[s.choice, stock === option.value && s.choiceActive]}
            >
              <Text style={[s.choiceText, stock === option.value && { color: '#fff' }]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Active</Text>
            <Text style={s.hint}>Inactive products stay in your catalogue but are marked unavailable.</Text>
          </View>
          <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.primary }} />
        </View>

        <Input label="Description" multiline value={description} onChangeText={setDescription} placeholder="Describe this product" error={fieldError('description')} />
        <Button title={edit ? 'Save Changes' : 'Add Product'} disabled={!valid} loading={mutation.isPending} onPress={submit} />
        {edit && <Button title="Delete Product" variant="danger" loading={remove.isPending} onPress={confirmDelete} />}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  form: { padding: 16, gap: 15 },
  pair: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -7 },
  tag: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.primarySoft },
  tagText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  photo: { alignSelf: 'center', width: 96, height: 96, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: '#f3f5f4', alignItems: 'center', justifyContent: 'center' },
  photoImg: { width: 94, height: 94, borderRadius: 15 },
  photoText: { fontSize: 12, color: colors.muted, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  choices: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: -7 },
  choice: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#edf1ef' },
  choiceActive: { backgroundColor: colors.primary },
  choiceText: { fontSize: 12, fontWeight: '800', color: colors.muted },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.dangerSoft },
  bannerText: { flex: 1, fontSize: 13, color: colors.danger, fontWeight: '600', lineHeight: 18 },
});
