import {
  ChatProvider,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import { useEffect, type ReactElement } from 'react';
import { BrowserRouter } from 'react-router';
import { LinkedChatPanel } from '#extensions/nocobase-agent-chat/linked-chat-panel';
import { LinkedChatHeaderButton } from '#extensions/nocobase-agent-chat/linked-launchers';

function OpenList(): null {
  const { openChat } = useChatPanel();
  useEffect(() => openChat({ view: 'history' }), [openChat]);
  return null;
}
/** Both variants need only the agents provider; application-specific associations are optional slots. */
export function AgentChatLinkedDemo(): ReactElement {
  return (
    <BrowserRouter basename='/demo/agents/agent-chat-linked'>
      <ChatProvider memoryScope='linked-demo'>
        <OpenList />
        <div className='flex h-svh flex-col bg-background'>
          <header className='flex h-14 items-center justify-between border-b px-4'>
            <span>Linked conversations</span>
            <LinkedChatHeaderButton />
          </header>
          <div className='relative flex min-h-0 flex-1'>
            <main className='flex-1 p-6'>
              Open a conversation, then its details. Associations use generic
              link views or application render slots.
            </main>
            <LinkedChatPanel />
          </div>
        </div>
      </ChatProvider>
    </BrowserRouter>
  );
}
