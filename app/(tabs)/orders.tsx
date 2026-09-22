import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@/constants/theme';
import { OrderCard } from '@/components/common';
import { EmptyState, Icon } from '@/components/ui';
import { ErrorState, Loading } from '@/components/states';
import { Screen } from '@/components/screen';
import { useOrders } from '@/features/queries';
import { orderFilters, type OrderFilter } from '@/features/filters';

/** GET /orders, with the status filter applied server-side and paged by offset. */
export default function Orders() {
  const [filter, setFilter] = useState<OrderFilter>('all');
  const { orders, isPending, isRefetching, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useOrders({
    status: filter === 'all' ? undefined : filter,
  });

  return (
    <Screen scroll={false}>
      <View style={s.header}>
        <Text style={s.title}>Orders</Text>
        <Link href="/orders/new" asChild>
          <Pressable style={s.add} accessibilityLabel="New order">
            <Icon name="add" color="#fff" />
          </Pressable>
        </Link>
      </View>
      <View style={s.filters}>
        {orderFilters.map((x) => (
          <Pressable key={x} onPress={() => setFilter(x)} style={[s.filter, filter === x && s.active]}>
            <Text style={[s.filterText, filter === x && s.activeText]}>{x[0].toUpperCase() + x.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      {isPending ? (
        <Loading label="Loading orders…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          contentContainerStyle={s.list}
          data={orders}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => <OrderCard order={item} />}
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
              icon="bag-outline"
              title="No orders here"
              description={filter === 'all' ? 'Create your first order to see it here.' : 'No orders match this filter.'}
            />
          }
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 21, fontWeight: '800', color: colors.text },
  add: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 12 },
  filter: { paddingVertical: 8, paddingHorizontal: 8, borderRadius: 11, backgroundColor: '#edf1ef' },
  active: { backgroundColor: colors.primary },
  filterText: { fontSize: 10, fontWeight: '800', color: colors.muted },
  activeText: { color: '#fff' },
  list: { paddingHorizontal: 16, gap: 9, paddingBottom: 24 },
  footer: { paddingVertical: 16 },
});
