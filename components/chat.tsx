import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { Badge, Icon } from './ui';
import { Header, Screen } from './screen';
import { ErrorState, Loading } from './states';
import { useConversation, useSendMessage, useWhatsApp } from '@/features/queries';
import { errorMessage } from '@/services/api/errors';
import type { Message, MessageStatus } from '@/types/domain';

/**
 * Conversation view.
 *
 * Messages are read from GET /conversations/{id} and sent through
 * POST /messages. The app never talks to Meta: the send goes
 * Android -> Muenot API -> Muenot WhatsApp service -> Meta Cloud API, and the
 * bubble only appears once the backend has accepted it.
 */

/** Ticks mirror what the backend actually recorded; a queued send shows a clock. */
const STATUS_ICON: Record<MessageStatus, { name: any; color: string }> = {
  queued: { name: 'time-outline', color: '#cfe8dc' },
  sent: { name: 'checkmark', color: '#cfe8dc' },
  delivered: { name: 'checkmark-done', color: '#cfe8dc' },
  read: { name: 'checkmark-done', color: '#8fd7ff' },
  failed: { name: 'alert-circle', color: '#ffc9c9' },
};

export function Chat({ id }: { id: string }) {
  const { conversation, isPending, error, refetch } = useConversation(id);
  const send = useSendMessage(id);
  const { caps } = useWhatsApp();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  // canSend is advisory only — POST /messages re-checks it and answers 403.
  const canSend = caps ? caps.canSend : true;

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || send.isPending) return;
    send.mutate(
      { mode: 'text', message: text },
      {
        onSuccess: () => {
          setDraft('');
          requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
        },
        // Nothing is shown as sent unless the backend confirmed it, so a
        // failure keeps the draft exactly where the shopkeeper left it.
        onError: (sendError) => Alert.alert('Message not sent', errorMessage(sendError)),
      },
    );
  }, [draft, send]);

  if (isPending) {
    return (
      <Screen scroll={false}>
        <Header title="Conversation" />
        <Loading label="Loading messages…" />
      </Screen>
    );
  }
  if (error || !conversation) {
    return (
      <Screen scroll={false}>
        <Header title="Conversation" />
        <ErrorState error={error} onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} keyboard>
      <Header
        title={conversation.customer.name}
        subtitle={conversation.customer.phone}
        action={
          <Pressable
            accessibilityLabel="Create order from this chat"
            style={s.headAction}
            onPress={() => router.push(`/orders/new?conversation=${conversation.id}`)}
          >
            <Icon name="bag-add-outline" />
          </Pressable>
        }
      />
      {conversation.tags.length > 0 && (
        <View style={s.chatTags}>
          {conversation.tags.map((x) => (
            <Badge key={x}>{x}</Badge>
          ))}
        </View>
      )}
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={s.messages}
        data={conversation.messages}
        keyExtractor={(x) => x.id}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={11}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={s.empty}>No messages in this conversation yet.</Text>}
        renderItem={({ item }) => <Bubble message={item} />}
      />
      <View style={s.composer}>
        <TextInput
          style={s.composeInput}
          value={draft}
          onChangeText={setDraft}
          placeholder={canSend ? 'Type a message' : 'You cannot send messages'}
          placeholderTextColor={colors.muted}
          editable={canSend && !send.isPending}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!canSend || !draft.trim() || send.isPending}
          onPress={submit}
        >
          {send.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Icon name="send" color={!canSend || !draft.trim() ? colors.muted : colors.primary} />
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

function Bubble({ message }: { message: Message }) {
  const out = message.direction === 'out';
  const tick = out && message.status ? STATUS_ICON[message.status] : null;
  return (
    <View style={[s.message, out ? s.out : s.in]}>
      <Text style={[s.messageText, out && { color: '#fff' }]}>{message.text}</Text>
      <View style={s.metaRow}>
        <Text style={[s.time, out && { color: '#ddf2e7' }]}>{message.time}</Text>
        {tick && <Icon name={tick.name} size={13} color={tick.color} />}
      </View>
      {message.status === 'failed' && message.errorMessage && <Text style={s.failed}>{message.errorMessage}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  chatTags: { flexDirection: 'row', gap: 6, padding: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  messages: { padding: 12, gap: 12, flexGrow: 1 },
  message: { maxWidth: '78%', borderRadius: 15, padding: 10, gap: 3 },
  out: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 3 },
  in: { alignSelf: 'flex-start', backgroundColor: '#e9eeeb', borderBottomLeftRadius: 3 },
  messageText: { fontSize: 14, color: colors.text, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  time: { fontSize: 10, color: colors.muted },
  failed: { fontSize: 10, color: '#ffd9d9' },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: 40 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  composeInput: { flex: 1, maxHeight: 100, fontSize: 14, color: colors.text },
  headAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
