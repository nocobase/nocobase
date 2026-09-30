import type { Chat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useCallback, useSyncExternalStore } from 'react';

const MESSAGE_THROTTLE_MS = 32;

export function useChatState<CHAT_MESSAGE extends UIMessage>(
  chat: Chat<CHAT_MESSAGE>,
) {
  // The throttle the Chat offers keeps its pending notification when the
  // subscription ends, so a message update that lands just before an unmount
  // still reaches React afterwards. Throttling here lets unsubscribing cancel it.
  const subscribeToMessages = useCallback(
    (onStoreChange: () => void) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let lastNotifiedAt = 0;
      const notify = () => {
        timer = undefined;
        lastNotifiedAt = Date.now();
        onStoreChange();
      };
      const unsubscribe = chat['~registerMessagesCallback'](() => {
        clearTimeout(timer);
        const wait = MESSAGE_THROTTLE_MS - (Date.now() - lastNotifiedAt);
        if (wait <= 0) notify();
        else timer = setTimeout(notify, wait);
      });
      return () => {
        clearTimeout(timer);
        unsubscribe();
      };
    },
    [chat],
  );
  const subscribeToStatus = useCallback(
    (onStoreChange: () => void) =>
      chat['~registerStatusCallback'](onStoreChange),
    [chat],
  );
  const subscribeToError = useCallback(
    (onStoreChange: () => void) =>
      chat['~registerErrorCallback'](onStoreChange),
    [chat],
  );
  const getMessages = useCallback(() => chat.messages, [chat]);
  const getStatus = useCallback(() => chat.status, [chat]);
  const getError = useCallback(() => chat.error, [chat]);

  return {
    messages: useSyncExternalStore(
      subscribeToMessages,
      getMessages,
      getMessages,
    ),
    status: useSyncExternalStore(subscribeToStatus, getStatus, getStatus),
    error: useSyncExternalStore(subscribeToError, getError, getError),
  };
}
