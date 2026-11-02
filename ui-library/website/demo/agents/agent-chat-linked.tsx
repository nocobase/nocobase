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
import { BrowserRouter } from 'react-router';
import { cn } from 'cn';
import {
  LinkedChatPanel,
  type LinkedChatPanelProps,
} from '#extensions/nocobase-agent-chat/linked-chat-panel';
import {
  LinkedChatFloatingButton,
  LinkedChatHeaderButton,
} from '#extensions/nocobase-agent-chat/linked-launchers';
import type { AssociationSectionProps } from '#extensions/nocobase-agent-chat/conversation-associations';

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

function OpenList(): null {
  const { openChat } = useChatPanel();
  useEffect(() => openChat({ view: 'history' }), [openChat]);
  return null;
}
/**
 * The linked panel: list-first opening, the shared header, the summary row and the conversation details (linked
 * work, runtime, usage). Linked work uses the agents plugin's generic link views; `slots.issue` shows how an
 * application renders one kind its own way, while the `document` link keeps the default rows.
 */
export function AgentChatLinkedDemo(): ReactElement {
  return (
    <BrowserRouter basename='/demo/agents/agent-chat-linked'>
      <ChatProvider memoryScope='linked-demo'>
        <OpenList />
        <div className='flex h-svh flex-col bg-background'>
          <header className='flex h-14 shrink-0 items-center justify-between border-b px-4'>
            <p className='text-sm font-medium'>{L('Workspace', '工作区')}</p>
            <LinkedChatHeaderButton />
          </header>
          <div className='relative flex min-h-0 flex-1'>
            <main className='min-w-0 flex-1 p-6 text-sm text-muted-foreground'>
              {L(
                'The header button opens the conversation list first. Open “Release follow-up” to see the summary row and its details.',
                '顶部按钮先打开会话列表。打开「发布跟进」可以看到任务摘要行和会话详情。',
              )}
            </main>
            <LinkedChatPanel slots={slots} />
          </div>
        </div>
        <LinkedChatFloatingButton />
      </ChatProvider>
    </BrowserRouter>
  );
}
