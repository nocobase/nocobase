import {
  agentsQueryClient,
  chatKeys,
  useChatApi,
  type ConversationActions,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import { useToaster } from '@nocobase/app-client';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useOnlineAgentIdentityActive } from '#components/online-agent/identity-context';
import { useChatTranslation } from './chat-i18n.js';

/** Application-local actions: detached SDK mutations must not repopulate another identity's shared cache. */
export function useConversationActions(): ConversationActions {
  const api = useChatApi();
  const queryClient = agentsQueryClient();
  const toaster = useToaster();
  const { t } = useChatTranslation();
  const isIdentityActive = useOnlineAgentIdentityActive();
  const remember = useCallback(
    (detail: ConversationDetail): void => {
      if (!isIdentityActive()) return;
      queryClient.setQueryData(chatKeys.conversation(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: chatKeys.lists });
    },
    [queryClient, isIdentityActive],
  );
  const failed = (): void => {
    if (isIdentityActive())
      toaster.show({ type: 'error', title: t('chat.errors.requestFailed') });
  };
  const rename = useMutation(
    {
      mutationFn: (input: { readonly id: string; readonly title: string }) =>
        api.updateConversation(input.id, { title: input.title }),
      onSuccess: (detail) => {
        if (!isIdentityActive()) return;
        remember(detail);
        toaster.show({ type: 'success', title: t('chat.renamed') });
      },
      onError: failed,
    },
    queryClient,
  );
  const archive = useMutation(
    {
      mutationFn: (input: {
        readonly id: string;
        readonly archived: boolean;
      }) => api.updateConversation(input.id, { archived: input.archived }),
      onSuccess: (detail, input) => {
        if (!isIdentityActive()) return;
        remember(detail);
        if (!input.archived) {
          toaster.show({ type: 'success', title: t('chat.unarchived') });
          return;
        }
        const toastId = toaster.show({
          type: 'success',
          title: t('chat.archivedNamed', {
            title: detail.title || t('chat.untitled'),
          }),
          action: {
            label: t('chat.undo'),
            onClick: () => {
              if (!isIdentityActive()) return;
              toaster.close(toastId);
              archive.mutate({ id: input.id, archived: false });
            },
          },
        });
      },
      onError: failed,
    },
    queryClient,
  );
  const stop = useMutation(
    {
      mutationFn: (id: string) => api.stop(id),
      onSuccess: remember,
      onError: failed,
    },
    queryClient,
  );
  const markRead = useCallback(
    (id: string): void => {
      void api
        .markRead(id)
        .then(remember)
        .catch(() => undefined);
    },
    [api, remember],
  );
  return { rename, archive, stop, markRead };
}
