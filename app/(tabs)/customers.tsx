import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@/constants/theme';
import { CustomerCard } from '@/components/common';
import { EmptyState, Icon, Input } from '@/components/ui';
import { ErrorState, Loading } from '@/components/states';
import { Screen } from '@/components/screen';
import { useCustomers } from '@/features/queries';
import { useDebounced } from '@/features/use-debounced';

/** Customers are the tenant's WhatsApp contacts: GET /contacts, paged by offset. */
export default function Customers() {
  const [q, setQ] = useState('');
  const search = useDebounced(q, 350);
  const { customers, total, isPending, isRefetching, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCustomers({ search: search.trim() || undefined });

  return (
    <Screen scroll={false}>
      <View style={s.header}>
        <Text style={s.title}>Customers</Text>
        <Link href="/customers/new" asChild>
          <Pressable style={s.add} accessibilityLabel="Add customer">
            <Icon name="person-add" color="#fff" />
          </Pressable>
        </Link>
      </View>
      <View style={s.pad}>
        <Input placeholder="Search by name, phone or email" value={q} onChangeText={setQ} autoCapitalize="none" />
        {!isPending && !error && (
          <Text style={s.count}>
            {total} customer{total === 1 ? '' : 's'}
          </Text>
        )}
      </View>
      {isPending ? (
        <Loading label="Loading customers…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => <CustomerCard customer={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={s.footer} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No customers found"
              description={search ? 'Try a different search.' : 'Add a customer, or wait for one to message you on WhatsApp.'}
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
  pad: { paddingHorizontal: 16, gap: 10 },
  count: { fontSize: 12, color: colors.muted },
  footer: { paddingVertical: 16 },
});
