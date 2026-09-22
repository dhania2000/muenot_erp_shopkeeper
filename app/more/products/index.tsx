import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Header } from '@/components/screen';
import { ProductCard } from '@/components/common';
import { EmptyState, Icon, Input } from '@/components/ui';
import { ErrorState, Loading } from '@/components/states';
import { useProducts } from '@/features/queries';
import { filterProducts, productCategories } from '@/features/filters';
import { useDebounced } from '@/features/use-debounced';
import { colors } from '@/constants/theme';

/**
 * GET /products. Search goes to the backend (it matches name, SKU and
 * category); the category chips are built from the loaded page because the API
 * exposes no categories endpoint.
 */
export default function Products() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const search = useDebounced(q, 350);

  const { products, isPending, isRefetching, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProducts({ search: search.trim() || undefined, category: category === 'all' ? undefined : category });

  const cats = useMemo(() => productCategories(products), [products]);
  const data = useMemo(() => filterProducts(products, category, search.trim()), [products, category, search]);

  return (
    <Screen scroll={false}>
      <Header
        title="Products"
        action={
          <Link href="/more/products/new" asChild>
            <Pressable style={s.add} accessibilityLabel="Add product">
              <Icon name="add" color="#fff" />
            </Pressable>
          </Link>
        }
      />
      <View style={s.pad}>
        <Input placeholder="Search products" value={q} onChangeText={setQ} autoCapitalize="none" />
        {cats.length > 1 && (
          <View style={s.filters}>
            {cats.map((x) => (
              <Pressable key={x} onPress={() => setCategory(x)} style={[s.filter, category === x && s.active]}>
                <Text style={[s.text, category === x && s.on]}>{x}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      {isPending ? (
        <Loading label="Loading products…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          contentContainerStyle={s.list}
          data={data}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={s.footer} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="No products found"
              description={search || category !== 'all' ? 'Try a different search or category.' : 'Add your first product.'}
            />
          }
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  add: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 16, gap: 12 },
  filters: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filter: { paddingVertical: 7, paddingHorizontal: 10, backgroundColor: '#edf1ef', borderRadius: 12 },
  active: { backgroundColor: colors.primary },
  text: { fontSize: 11, color: colors.muted, fontWeight: '700', textTransform: 'capitalize' },
  on: { color: '#fff' },
  list: { paddingHorizontal: 16, gap: 9, paddingBottom: 24 },
  footer: { paddingVertical: 16 },
});
