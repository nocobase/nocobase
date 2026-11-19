import {
  CancelledError,
  useIsMutating,
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { OnlineChatConfigSnapshot } from '../../shared/conversations.js';
import type { ModelRef, ReasoningLevel } from '../../shared/models.js';
import { agentsQueryClient } from '../query.js';
import { useChatController } from './controller.js';
import { chatKeys } from './keys.js';
import { useChatApi } from './use-chat.js';

/**
 * One explicit change: a model alone, or any of the model, web search and thinking level together, so a model switch
 * can carry the level remembered for the new model in the same write.
 */
export type ConversationModelChange =
  | ModelRef
  | {
      readonly selectedModel?: ModelRef;
      readonly webSearch?: boolean;
      readonly thinking?: ReasoningLevel;
    };

export interface ConversationModel {
  readonly configuration: UseQueryResult<OnlineChatConfigSnapshot>;
  readonly select: UseMutationResult<
    OnlineChatConfigSnapshot,
    Error,
    ConversationModelChange
  >;
  /** Shared across mounted views of this conversation. */
  readonly changing: boolean;
}

/**
 * Reads the saved model, web search and thinking level, and explicitly changes only what a change names, without
 * replacing the conversation's configuration.
 */
export function useConversationModel(
  id: string | null,
  enabled = true,
): ConversationModel {
  const api = useChatApi();
  const controller = useChatController();
  const client = agentsQueryClient();
  const key = chatKeys.configuration(id ?? '');
  const changing = useIsMutating({ mutationKey: key, exact: true }, client) > 0;
  const configuration = useQuery(
    {
      queryKey: key,
      queryFn: async ({ signal }) => {
        const active = controller.lifetime();
        if (!active()) throw new CancelledError({ silent: true });
        const result = await api.configuration(id!, signal);
        if (!active()) throw new CancelledError({ silent: true });
        return result;
      },
      enabled: id !== null && enabled && !changing,
      placeholderData: () => undefined,
      retry: false,
      refetchOnWindowFocus: 'always',
    },
    client,
  );
  const select = useMutation(
    {
      mutationKey: key,
      retry: false,
      mutationFn: async (change: ConversationModelChange) => {
        const active = controller.lifetime();
        if (!id || !active()) throw new CancelledError({ silent: true });
        await client.cancelQueries({ queryKey: key, exact: true });
        if (!active()) throw new CancelledError({ silent: true });
        try {
          const model =
            'modelService' in change ? change : change.selectedModel;
          const overrides =
            'modelService' in change
              ? {}
              : {
                  ...(change.webSearch === undefined
                    ? {}
                    : { webSearch: change.webSearch }),
                  ...(change.thinking === undefined
                    ? {}
                    : { thinking: change.thinking }),
                };
          const result = await api.configure(id, overrides, model);
          if (!active()) return result;
          await client.cancelQueries({ queryKey: key, exact: true });
          if (active()) client.setQueryData(key, result);
          return result;
        } catch (error) {
          if (active()) {
            // A lost response may follow a committed update. Re-read; never retry the write.
            void client.invalidateQueries({ queryKey: key, exact: true });
            void client.invalidateQueries({
              queryKey: chatKeys.conversation(id),
              exact: true,
            });
          }
          throw error;
        }
      },
    },
    client,
  );
  return { configuration, select, changing };
}
