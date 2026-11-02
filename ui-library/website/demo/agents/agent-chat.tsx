import {
  ChatProvider,
  useChatContextSource,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import { useEffect, type ReactElement } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router';

import { ChatPanel } from '#extensions/nocobase-agent-chat/chat-panel';
import { ChatConversationPage } from '#extensions/nocobase-agent-chat/conversation-page';
import {
  AskAgentButton,
  ChatFloatingButton,
  ChatHeaderButton,
} from '#extensions/nocobase-agent-chat/launchers';

const zh =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('lang') === 'zh-CN';
const L = (en: string, cn: string): string => (zh ? cn : en);

const ISSUE = {
  kind: 'issue',
  id: 'pm-12',
  label: L('PM-12 Welcome tour', 'PM-12 欢迎引导'),
};

/** A page that tells the panel what it shows: the issue becomes a chip in the composer. */
function IssuePage(): ReactElement {
  useChatContextSource(ISSUE);
  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-4 p-6'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs text-muted-foreground'>PM-12</p>
          <h1 className='text-lg font-semibold'>
            {L('Welcome tour', '欢迎引导')}
          </h1>
        </div>
        <AskAgentButton
          item={ISSUE}
          newConversation
          draft={L(
            'Summarize this issue and what is left to do.',
            '总结一下这个任务还剩什么。',
          )}
        />
      </div>
      <p className='text-sm text-muted-foreground' hidden={zh}>
        New members see a short tour of the workspace the first time they sign
        in: the projects, the inbox and how to ask an agent. Select text here
        and it goes along as context.
      </p>
      <p className='text-sm text-muted-foreground' hidden={zh}>
        Ask agent starts a new conversation: its agent, and the model of an
        online agent, are chosen in the composer before the first message, and
        the header then shows that agent for as long as the conversation lasts.
        The next new conversation starts with the agent used last.
      </p>
      {zh ? (
        <p className='text-sm text-muted-foreground'>
          新成员第一次登录时会看到一段简短的工作区引导：项目、收件箱，以及怎样问
          Agent。在这里选中文字，会作为上下文一起发送。「问
          Agent」会新建对话；顶部按钮打开对话面板。
        </p>
      ) : null}
      <p className='text-sm text-muted-foreground' hidden={zh}>
        The switch in the panel&apos;s list header moves between the online
        agent and runner agents, each with its own conversations. Click a
        context chip to see what it carries. Open the demo with{' '}
        <code>?agents=online</code> or <code>?agents=runner</code> to see the
        panel with one kind of agent and no switch.
      </p>
    </div>
  );
}

function ConversationRoute(): ReactElement {
  const { conversationId } = useParams();
  if (!conversationId) return <Navigate to='/' replace />;
  return (
    <ChatConversationPage
      conversationId={conversationId}
      newConversationPath='/'
    />
  );
}

/** Opens the panel on a sample conversation, so the preview shows it at once; a full-page conversation shows alone. */
function OpenOnArrival(): null {
  const { openChat } = useChatPanel();
  const onPage = useLocation().pathname.startsWith('/chat/');
  useEffect(() => {
    if (!onPage) openChat({ conversationId: 'release-plan' });
  }, [openChat, onPage]);
  return null;
}

/**
 * The agent-chat block as an application's shell wires it: `ChatProvider` around the routes, the header button, the
 * panel beside `<main>` in a `relative flex` row, the floating button below `md`, and a full-page conversation route.
 */
export function AgentChatDemo(): ReactElement {
  return (
    <BrowserRouter basename='/demo/agents/agent-chat'>
      <ChatProvider
        conversationPath={(id) => `/chat/${id}`}
        // The signed-in person's id in an application, so the agent last used is remembered for them.
        memoryScope='demo-user'
      >
        <OpenOnArrival />
        <div className='flex h-svh flex-col bg-background'>
          <header className='flex h-14 shrink-0 items-center justify-between border-b px-4'>
            <p className='text-sm font-medium'>{L('Workspace', '工作区')}</p>
            <ChatHeaderButton />
          </header>
          <div className='relative flex min-h-0 flex-1'>
            <main className='relative min-w-0 flex-1 overflow-y-auto'>
              <Routes>
                <Route
                  path='/chat/:conversationId'
                  element={<ConversationRoute />}
                />
                <Route path='*' element={<IssuePage />} />
              </Routes>
            </main>
            <ChatPanel />
          </div>
        </div>
        <ChatFloatingButton />
      </ChatProvider>
    </BrowserRouter>
  );
}
