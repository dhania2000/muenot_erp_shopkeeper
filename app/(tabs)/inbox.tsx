import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { ConversationCard } from '@/components/common';
import { EmptyState, Icon, Input } from '@/components/ui';
import { ErrorState, Loading } from '@/components/states';
import { Screen } from '@/components/screen';
import { useConversations } from '@/features/queries';
import { filterConversations, inboxFilters, type InboxFilter } from '@/features/filters';
import { useDebounced } from '@/features/use-debounced';

/**
 * Inbox reads GET /conversations. Search and the unread filter are pushed to
 * the backend (both are supported query parameters); assigned/unassigned has
 * no server-side equivalent, so it is applied to the returned page.
 */
export default function Inbox() {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [q, setQ] = useState('');
  const search = useDebounced(q, 350);

  const { conversations, isPending, isRefetching, error, refetch } = useConversations({
    search: search.trim() || undefined,
    unread: filter === 'unread' || undefined,
  });

  const data = useMemo(
    // The server already applied search; re-running it locally is harmless and
    // keeps the list responsive while a new query is in flight.
    () => filterConversations(conversations, filter, search.trim()),
    [conversations, filter, search],
  );

  return (
    <Screen scroll={false}>
      <View style={s.header}>
        <Text style={s.title}>Inbox</Text>
        <Icon name="options-outline" />
      </View>
      <View style={s.pad}>
        <Input placeholder="Search conversations" value={q} onChangeText={setQ} autoCapitalize="none" />
      </View>
      <View style={s.filters}>
        {inboxFilters.map((x) => (
          <Pressable key={x} onPress={() => setFilter(x)} style={[s.filter, filter === x && s.active]}>
            <Text style={[s.filterText, filter === x && s.activeText]}>{x[0].toUpperCase() + x.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      {isPending ? (
        <Loading label="Loading conversations…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => <ConversationCard conversation={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations found"
              description={search ? 'Try a different search term.' : 'Messages from your customers will appear here.'}
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
  pad: { paddingHorizontal: 16 },
  filters: { flexDirection: 'row', gap: 7, padding: 16 },
  filter: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12, backgroundColor: '#edf1ef' },
  active: { backgroundColor: colors.primary },
  filterText: { fontSize: 11, fontWeight: '800', color: colors.muted },
  activeText: { color: '#fff' },
});
