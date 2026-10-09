/**
 * The panel's header: the conversation's title (click to rename; Enter saves, Escape cancels), then new conversation,
 * history, full screen (the application's page of the conversation when it has one, else full width) or back, a menu
 * (archive) and close; under it, once the conversation exists, its agent with its availability and mode (Online or
 * Runner), read-only. A conversation stays with its agent and its mode: a new conversation chooses its agent in the
 * composer (`NewChatChoice`), and another agent means a new conversation.
 */
import {
  useChatPanel,
  useConversation,
  useConversationActions,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  CONVERSATION_TITLE_MAX,
  type ConversationDetail,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  ArchiveIcon,
  HistoryIcon,
  Maximize2Icon,
  Minimize2Icon,
  MoreHorizontalIcon,
  SquarePenIcon,
  XIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { Input } from '#components/ui/input';
import { cn } from 'cn';

import { AgentLine } from './agent-status.js';
import { useChatTranslation } from './chat-i18n.js';

const TOUCH = "size-9 [&_svg:not([class*='size-'])]:size-4.5";

export function PanelHeader({
  compact,
}: {
  /** The full-screen mobile form: no width toggle. */
  readonly compact: boolean;
}): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const history = panel.view === 'history';
  const detail = useConversation(panel.conversationId);
  const conversation = detail.data ?? null;
  const actions = useConversationActions();
  const expanded = panel.mode === 'expanded';
  const menuTarget = history ? null : conversation;
  const pageTarget = panel.openPage && !expanded ? menuTarget : null;
  const shownTitle = history
    ? t('chat.history.title')
    : conversation
      ? conversation.title?.trim() || t('chat.untitled')
      : t('chat.newConversation');

  return (
    <header className='flex shrink-0 flex-col gap-1 border-b px-3 py-2'>
      <div className='flex min-w-0 items-center gap-0.5'>
        <ConversationTitle
          conversation={history ? null : conversation}
          shown={shownTitle}
        />
        <Button
          variant='ghost'
          size='icon-sm'
          className={TOUCH}
          aria-label={t('chat.newConversation')}
          title={t('chat.newConversation')}
          onClick={() => {
            panel.selectConversation(null);
            panel.focusComposer();
          }}
        >
          <SquarePenIcon />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          className={TOUCH}
          aria-label={t('chat.history.title')}
          title={t('chat.history.title')}
          aria-pressed={history}
          onClick={() => panel.setView(history ? 'chat' : 'history')}
          data-testid='chat-history-button'
        >
          <HistoryIcon />
        </Button>
        {compact ? null : pageTarget ? (
          // The application shows a conversation as a page of its own: "full screen" goes there.
          <Button
            variant='ghost'
            size='icon-sm'
            className={TOUCH}
            aria-label={t('chat.openPage')}
            title={t('chat.openPage')}
            onClick={() => panel.openPage?.(pageTarget.id)}
            data-testid='chat-open-page'
          >
            <Maximize2Icon />
          </Button>
        ) : (
          // Without a page to go to (a new conversation, the history, or no page at all), the panel covers the content.
          <Button
            variant='ghost'
            size='icon-sm'
            className={TOUCH}
            aria-label={expanded ? t('chat.restoreSize') : t('chat.expand')}
            title={expanded ? t('chat.restoreSize') : t('chat.expand')}
            onClick={() => panel.setMode(expanded ? 'docked' : 'expanded')}
            data-testid='chat-expand'
          >
            {expanded ? <Minimize2Icon /> : <Maximize2Icon />}
          </Button>
        )}
        {/* Always there, disabled without a conversation, so the row keeps its icons in place. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={!menuTarget}
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                className={TOUCH}
                aria-label={t('chat.more')}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-auto min-w-40'>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  if (!menuTarget) return;
                  actions.archive.mutate({
                    id: menuTarget.id,
                    archived: true,
                  });
                  panel.selectConversation(null);
                }}
              >
                <ArchiveIcon />
                {t('chat.archive')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant='ghost'
          size='icon-sm'
          className={TOUCH}
          aria-label={t('chat.close')}
          title={t('chat.close')}
          onClick={panel.closeChat}
        >
          <XIcon />
        </Button>
      </div>
      {!history && conversation ? (
        <AgentLine conversation={conversation} />
      ) : null}
    </header>
  );
}

/**
 * A conversation's title as a heading; clicking it renames the conversation in place (Enter saves, Escape cancels).
 * Without a conversation it is plain text (`shown`). The panel's header and the full-page view share it.
 */
export function ConversationTitle({
  conversation,
  shown,
  level = 2,
  className,
}: {
  readonly conversation: ConversationDetail | null;
  readonly shown: string;
  readonly level?: 1 | 2;
  /** The text's size and weight. */
  readonly className?: string;
}): ReactElement {
  const { t } = useChatTranslation();
  const actions = useConversationActions();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState('');
  const Heading = level === 1 ? 'h1' : 'h2';
  const text = className ?? 'text-sm font-semibold';

  function save(): void {
    setRenaming(false);
    const next = title.trim().slice(0, CONVERSATION_TITLE_MAX);
    if (conversation && next && next !== conversation.title)
      actions.rename.mutate({ id: conversation.id, title: next });
  }

  if (renaming && conversation)
    return (
      <Input
        autoFocus
        value={title}
        maxLength={CONVERSATION_TITLE_MAX}
        className='h-8 flex-1'
        aria-label={t('chat.rename')}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            save();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setRenaming(false);
          }
        }}
      />
    );
  return (
    <Heading className='min-w-0 flex-1'>
      {conversation ? (
        <button
          type='button'
          className={cn(
            'block max-w-full truncate rounded-md px-1 text-left hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
            text,
          )}
          title={t('chat.renameHint', { title: shown })}
          onClick={() => {
            setTitle(conversation.title ?? '');
            setRenaming(true);
          }}
          data-testid='chat-title'
        >
          {shown}
        </button>
      ) : (
        <span
          className={cn('block truncate px-1', text)}
          data-testid='chat-title'
        >
          {shown}
        </span>
      )}
    </Heading>
  );
}
