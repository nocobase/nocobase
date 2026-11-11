import {
  ChatProvider,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationLink } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
} from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from 'react-router';
import { cn } from 'cn';
import {
  LinkedChatPanel,
  type LinkedChatPanelProps,
} from '#extensions/nocobase-agent-chat/linked-chat-panel';
import {
  LinkedChatFloatingButton,
  LinkedChatHeaderButton,
} from '#extensions/nocobase-agent-chat/linked-launchers';
import {
  ConversationAssociationsProvider,
  type AssociationSectionProps,
} from '#extensions/nocobase-agent-chat/conversation-associations';
import { ChatWorkspace } from '#extensions/nocobase-agent-chat/workspace';

const zh =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('lang') === 'zh-CN';
const L = (en: string, cn: string): string => (zh ? cn : en);

/** The application's own vocabulary for its `issue` links; the panel itself only knows status words. */
const ORDER = [
  L('In review', '待验收'),
  L('In progress', '进行中'),
  L('Todo', '待规划'),
  L('Done', '已完成'),
];
function StatusIcon({
  status,
}: {
  readonly status: string | null;
}): ReactElement {
  const className = 'size-3.5 shrink-0';
  if (status === ORDER[0])
    return <CircleDotIcon className={cn(className, 'text-primary')} />;
  if (status === ORDER[1])
    return <CircleIcon className={cn(className, 'text-primary')} />;
  if (status === ORDER[3])
    return (
      <CircleCheckIcon className={cn(className, 'text-muted-foreground')} />
    );
  return (
    <CircleDashedIcon className={cn(className, 'text-muted-foreground')} />
  );
}
const rank = (link: ConversationLink) => {
  const index = ORDER.indexOf(link.view?.status ?? '');
  return index < 0 ? ORDER.length : index;
};

/** A per-kind render slot, as an application supplies one: single rows ordered by what needs attention first. */
function TaskRows({ links }: AssociationSectionProps): ReactElement {
  return (
    <ul className='min-w-0 divide-y rounded-md border bg-card'>
      {[...links]
        .sort((a, b) => rank(a) - rank(b))
        .map((link) => (
          <li
            key={link.id}
            className='flex min-w-0 items-center gap-2 px-2 py-1.5 text-xs'
          >
            <StatusIcon status={link.view!.status} />
            <span className='shrink-0 font-medium'>{link.view!.key}</span>
            <span className='min-w-0 flex-1 truncate'>{link.view!.title}</span>
            <span className='shrink-0 text-muted-foreground'>
              {link.view!.status}
            </span>
          </li>
        ))}
    </ul>
  );
}

const slots: LinkedChatPanelProps['slots'] = {
  issue: {
    label: L('Tasks', '任务'),
    render: (props) => <TaskRows {...props} />,
  },
  document: { label: L('Documents', '文档') },
};

/** The preview opens on a conversation with linked tasks; the header button still opens the list first. */
function OpenOnArrival(): null {
  const { openChat } = useChatPanel();
  useEffect(
    () => openChat({ conversationId: 'release-follow-up', view: 'chat' }),
    [openChat],
  );
  return null;
}
/** The workspace as a page: the selection is in the address (`/c/<id>`, `/new`), so it is shareable. */
function WorkspacePage(): ReactElement {
  const navigate = useNavigate();
  const match = useMatch('/page/c/:conversationId');
  const fresh = useMatch('/page/new');
  const conversationId = match?.params.conversationId ?? null;
  return (
    <ConversationAssociationsProvider slots={slots}>
      <ChatWorkspace
        conversationId={conversationId ?? (fresh ? null : 'release-follow-up')}
        view={match || fresh ? 'conversation' : 'list'}
        onOpen={(id) => void navigate(`/page/c/${id}${window.location.search}`)}
        onNew={() => void navigate(`/page/new${window.location.search}`)}
        onBack={() => void navigate(`/page${window.location.search}`)}
        storageKey='details-demo:workspace'
      />
    </ConversationAssociationsProvider>
  );
}

/**
 * The details recipe as an application uses it twice: the side panel (`LinkedChatPanel`, the selection in the panel
 * store, with Close and Expand) and a full page (`ChatWorkspace` under `/page`, the selection in the address). Both
 * are the same workspace and lay themselves out by their own width: narrow (list or conversation), medium (list and
 * conversation, details as a sheet) and wide (list, conversation and details). Linked work uses the agents plugin's
 * generic link views; `slots.issue` renders one kind the application's way, the `document` link the default rows.
 */
export function AgentChatDetailsDemo(): ReactElement {
  return (
    <BrowserRouter basename='/demo/agents/agent-chat-details'>
      <ChatProvider memoryScope='details-demo'>
        <Routes>
          <Route path='/page/*' element={<PageShell />} />
          <Route path='*' element={<PanelShell />} />
        </Routes>
      </ChatProvider>
    </BrowserRouter>
  );
}

function PageShell(): ReactElement {
  return (
    <div className='flex h-svh flex-col bg-background'>
      <header className='flex h-14 shrink-0 items-center border-b px-4'>
        <p className='text-sm font-medium'>{L('My sessions', '我的会话')}</p>
      </header>
      <main className='min-h-0 flex-1'>
        <WorkspacePage />
      </main>
    </div>
  );
}

function PanelShell(): ReactElement {
  return (
    <>
      <OpenOnArrival />
      <div className='flex h-svh flex-col bg-background'>
        <header className='flex h-14 shrink-0 items-center justify-between border-b px-4'>
          <p className='text-sm font-medium'>{L('Workspace', '工作区')}</p>
          <LinkedChatHeaderButton />
        </header>
        <div className='relative flex min-h-0 flex-1'>
          <main className='min-w-0 flex-1 p-6 text-sm text-muted-foreground'>
            {L(
              'The panel opens on “Release follow-up”: its summary row opens the details with the linked tasks, usage and runner. The header button opens the conversation list first. The same workspace as a page is at /demo/agents/agent-chat-details/page.',
              '面板打开的是「发布跟进」：点任务摘要行打开会话详情，里面有关联任务、用量和执行机。顶部按钮先打开会话列表。同一个工作区作为页面的样子在 /demo/agents/agent-chat-details/page。',
            )}
          </main>
          <LinkedChatPanel slots={slots} />
        </div>
      </div>
      <LinkedChatFloatingButton />
    </>
  );
}
