import { useApiClient } from '@nocobase/app-client';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import {
  chatPath,
  type ConversationLink,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  useConversation,
  agentsQueryClient,
  chatKeys,
} from '@nocobase/app-plugin-agents/client/chat';

export interface ConversationLinksSnapshot {
  readonly data: readonly ConversationLink[] | undefined;
}

/** Associations are projected by the existing conversation read, not a second endpoint or poll. */
export function useConversationLinks(
  conversationId: string | null,
): ConversationLinksSnapshot {
  const detail = useConversation(conversationId, { passive: true });
  return { data: detail.data?.links };
}

export function useRemoveConversationLink(
  conversationId: string,
): UseMutationResult<void, Error, ConversationLink> {
  const api = useApiClient();
  return useMutation(
    {
      mutationFn: async (link: ConversationLink) => {
        await api.request({
          path: `${chatPath('links', conversationId)}/${encodeURIComponent(link.id)}`,
          method: 'DELETE',
        });
      },
      onSuccess: (_result, link) => {
        const client = agentsQueryClient();
        void client.invalidateQueries({
          queryKey: chatKeys.conversation(conversationId),
          exact: true,
        });
        void client.invalidateQueries({
          queryKey: [...chatKeys.lists, 'linkedTo', link.kind, link.targetId],
        });
      },
    },
    agentsQueryClient(),
  );
}
