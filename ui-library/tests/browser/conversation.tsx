import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import { ConversationView } from '../../registry/agents/agent-chat/conversation-view';
export function FixtureConversation() {
  const panel = useChatPanel();
  return (
    <main className='mx-auto flex h-screen max-w-4xl flex-col p-6'>
      <h1 className='mb-4 text-xl font-semibold'>
        Registry chat regression host
      </h1>
      <button
        onClick={() =>
          panel.openChat({
            pin: {
              kind: 'issue',
              id: 'fixture',
              label: 'Retained fixture context',
            },
          })
        }
      >
        Pin fixture context
      </button>
      <ConversationView
        conversationId='registry-fixture'
        variant='page'
        className='min-h-0 flex-1'
      />
    </main>
  );
}
