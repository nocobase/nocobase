/**
 * The ✦ button's badge: how many of the viewer's conversations wait for them (a reply to read, a confirmation to give,
 * a failure to look at), read once from `GET /api/agents/conversationAttention` and again after one of their
 * conversations changed state (`conversation.changed` on `agents:conversations`, bursts read once). It never polls, and
 * streamed messages do not read it.
 */
import type { AppClientBadge } from '@nocobase/app-client/plugins';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { CONVERSATIONS_TOPIC } from '../../shared/conversations.js';
import { coalescedInvalidation } from '../chat/coalesced-invalidation.js';
import { useChatApi } from '../chat/use-chat.js';
import { useRealtimeTopic } from '../hooks/use-realtime-topic.js';
import { agentsQueryClient } from '../query.js';

export const ATTENTION_KEY = ['agents', 'chat', 'attention'] as const;

export function useAgentAttention(): AppClientBadge | undefined {
  const api = useChatApi();
  const client = agentsQueryClient();
  const counts = useQuery(
    {
      queryKey: ATTENTION_KEY,
      queryFn: () => api.attention(),
      staleTime: Infinity,
    },
    client,
  );
  const [refresh] = useState(() => coalescedInvalidation(client, 500));
  useEffect(() => refresh.stop, [refresh]);
  useRealtimeTopic(CONVERSATIONS_TOPIC, (payload) => {
    // A reconnect (no payload) or a conversation changing state may change the count.
    if (
      payload === undefined ||
      (typeof payload === 'object' &&
        payload !== null &&
        (payload as { kind?: unknown }).kind === 'conversation.changed')
    )
      refresh.add(ATTENTION_KEY, true);
  });
  const needsYou = counts.data?.needsYou ?? 0;
  return useMemo(
    () =>
      needsYou ? { count: needsYou, tone: 'attention' as const } : undefined,
    [needsYou],
  );
}
