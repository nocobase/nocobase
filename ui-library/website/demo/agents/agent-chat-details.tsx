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

/** The preview opens on a conversation with linked tasks; the header button still opens the list first. */
function OpenOnArrival(): null {
  const { openChat } = useChatPanel();
  useEffect(
    () => openChat({ conversationId: 'release-follow-up', view: 'chat' }),
    [openChat],
  );
  return null;
}
/**
 * The linked panel: list-first opening, the shared header, the summary row and the conversation details (linked
 * work, runtime, usage). Linked work uses the agents plugin's generic link views; `slots.issue` shows how an
 * application renders one kind its own way, while the `document` link keeps the default rows.
 */
export function AgentChatDetailsDemo(): ReactElement {
  return (
    <BrowserRouter basename='/demo/agents/agent-chat-details'>
      <ChatProvider memoryScope='details-demo'>
        <OpenOnArrival />
        <div className='flex h-svh flex-col bg-background'>
          <header className='flex h-14 shrink-0 items-center justify-between border-b px-4'>
            <p className='text-sm font-medium'>{L('Workspace', '工作区')}</p>
            <LinkedChatHeaderButton />
          </header>
          <div className='relative flex min-h-0 flex-1'>
            <main className='min-w-0 flex-1 p-6 text-sm text-muted-foreground'>
              {L(
                'The panel opens on “Release follow-up”: its summary row opens the details with the linked tasks, usage and runner. The header button opens the conversation list first; every Runner conversation there has linked tasks.',
                '面板打开的是「发布跟进」：点任务摘要行打开会话详情，里面有关联任务、用量和执行机。顶部按钮先打开会话列表，列表里每个 Runner 对话都有关联任务。',
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
