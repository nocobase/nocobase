/** A conversation's usage (`GET conversations/{id}/usage`), refreshed by conversation state announcements. */
import {
  agentsQueryClient,
  chatKeys,
  useChatApi,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationUsage } from '@nocobase/app-plugin-agents/shared/conversations';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/** The conversation's usage, refreshed by conversation state announcements. */
export function useConversationUsage(
  conversationId: string | null,
  _running: boolean,
  options: { readonly passive?: boolean } = {},
): UseQueryResult<ConversationUsage> {
  const api = useChatApi();
  const query = useQuery(
    {
      queryKey: [...chatKeys.conversation(conversationId ?? ''), 'usage'],
      queryFn: ({ signal }) => api.usage(conversationId!, signal),
      enabled: !options.passive && conversationId !== null,
      staleTime: 5_000,
    },
    agentsQueryClient(),
  );
  return query;
}
