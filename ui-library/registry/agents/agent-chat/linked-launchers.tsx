import type { ReactElement } from 'react';
import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import { ChatHeaderButton, ChatFloatingButton } from './launchers.js';
/** General launchers start at history; explicit record/draft entry keeps its own intent. */
export function LinkedChatHeaderButton(): ReactElement | null {
  const panel = useChatPanel();
  return (
    <ChatHeaderButton onOpen={() => panel.openChat({ view: 'history' })} />
  );
}
export function LinkedChatFloatingButton(): ReactElement | null {
  const panel = useChatPanel();
  return (
    <ChatFloatingButton onOpen={() => panel.openChat({ view: 'history' })} />
  );
}
