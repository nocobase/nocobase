import { useConversationActions } from './conversation-actions.js';
import {
  agentsOfMode,
  CHAT_PANEL_ATTRIBUTE,
  chatIsRunning,
  useAgentText,
  useChatAgents,
  useConversationList,
  useConversationSources,
  useFormatters,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  CONVERSATION_TITLE_MAX,
  PANEL_SOURCE,
  type ConversationListQuery,
  type ConversationMode,
  type ConversationSummary,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Maximize2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Skeleton } from '#components/ui/skeleton';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';
import { ChatTag, LoadError, Pulse } from './chat-ui.js';

const ALL = '__all__';

export interface HistoryListProps {
  /** Above the search, such as the list's title and a new conversation button. */
  readonly header?: ReactNode;
  readonly activeId: string | null;
  readonly onOpen: (conversationId: string) => void;
  /** Offered in each row's menu: open the conversation on the application's full-page view. */
  readonly onOpenPage?: ((conversationId: string) => void) | null;
  /** Only this mode's conversations (online or runner agents); left out, every conversation. */
  readonly mode?: ConversationMode | null;
  readonly className?: string;
  /** Offered under an empty list: start a new conversation. */
  readonly onNew?: () => void;
}

export function HistoryList({
  header,
  activeId,
  onOpen,
  onOpenPage,
  mode,
  className,
  onNew,
}: HistoryListProps): ReactElement {
  const { t } = useChatTranslation();
  const agents = useChatAgents();
  const sources = useConversationSources();
  const agentText = useAgentText();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const [agentId, setAgentId] = useState(ALL);
  const [source, setSource] = useState(ALL);
  // A filter of the other mode's agent would hide every row.
  const [seenMode, setSeenMode] = useState(mode);
  if (seenMode !== mode) {
    setSeenMode(mode);
    setAgentId(ALL);
  }
  useEffect(() => {
    const timer = window.setTimeout(() => setQ(text.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [text]);
  const bySource = !mode;
  const query: ConversationListQuery = {
    archived,
    ...(q ? { q } : {}),
    ...(mode ? { mode } : {}),
    ...(agentId === ALL ? {} : { agentId }),
    ...(bySource && source !== ALL ? { source } : {}),
  };
  const pages = useConversationList(query);
  const items = pages.data?.pages.flatMap((page) => page.items) ?? [];
  const listed = mode
    ? agentsOfMode(agents.data ?? [], mode)
    : (agents.data ?? []);
  const agentItems = [
    { value: ALL, label: t('chat.history.allAgents') },
    ...listed.map((agent) => ({
      value: agent.id,
      label: agentText.name(agent),
    })),
  ];
  // The online agent is one: a filter by agent would choose nothing.
  const byAgent = mode !== 'online';
  const sourceItems = [
    { value: ALL, label: t('chat.history.allSources') },
    { value: PANEL_SOURCE, label: t('chat.sources.panel') },
    ...sources.map((source) => ({ value: source.key, label: source.label })),
  ];
  const filtered =
    Boolean(q) || agentId !== ALL || (bySource && source !== ALL);

  return (
    <div
      className={cn('flex h-full min-h-0 flex-col', className)}
      data-testid='chat-history'
      data-mode={mode ?? undefined}
    >
      {header}
      <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3'>
        <div className='relative'>
          <SearchIcon
            className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'
            aria-hidden='true'
          />
          <Input
            type='search'
            value={text}
            className='pl-8'
            placeholder={t('chat.history.search')}
            aria-label={t('chat.history.search')}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        {byAgent || bySource ? (
          <div className='flex min-w-0 flex-wrap items-center gap-2'>
            {byAgent ? (
              <Select
                items={agentItems}
                value={agentId}
                onValueChange={(next: string | null) => setAgentId(next ?? ALL)}
              >
                <SelectTrigger
                  size='sm'
                  className='max-w-48 min-w-0'
                  aria-label={t('chat.history.agent')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  {agentItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {bySource ? (
              <Select
                items={sourceItems}
                value={source}
                onValueChange={(next: string | null) => setSource(next ?? ALL)}
              >
                <SelectTrigger
                  size='sm'
                  className='max-w-48 min-w-0'
                  aria-label={t('chat.history.source')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  {sourceItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        ) : null}
        {pages.isError && !pages.data ? (
          <LoadError
            title={t('chat.history.loadFailed')}
            error={pages.error}
            onRetry={() => void pages.refetch()}
          />
        ) : !pages.data ? (
          <div
            role='status'
            aria-label={t('chat.loading')}
            className='space-y-2 rounded-lg border bg-card p-3'
          >
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className='h-7 w-full' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className='flex flex-wrap items-center gap-x-2 px-1 py-1.5'>
            <p
              className='text-sm text-muted-foreground'
              data-testid='chat-history-empty'
            >
              {filtered
                ? t('chat.history.noMatch')
                : archived
                  ? t('chat.history.noArchived')
                  : t('chat.history.empty')}
            </p>
            {filtered ? (
              <Button
                variant='link'
                size='sm'
                className='h-auto p-0'
                onClick={() => {
                  setText('');
                  setQ('');
                  setAgentId(ALL);
                  setSource(ALL);
                }}
              >
                {t('chat.history.clearFilters')}
              </Button>
            ) : onNew && !archived ? (
              <Button
                variant='link'
                size='sm'
                className='h-auto p-0'
                onClick={onNew}
              >
                {t('chat.newConversation')}
              </Button>
            ) : null}
          </div>
        ) : (
          <ul
            className='flex flex-col gap-1'
            aria-label={t('chat.history.title')}
          >
            {items.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                active={item.id === activeId}
                onOpen={() => onOpen(item.id)}
                onOpenPage={onOpenPage ? () => onOpenPage(item.id) : null}
              />
            ))}
          </ul>
        )}
        {pages.hasNextPage ? (
          <Button
            variant='outline'
            size='sm'
            className='self-center'
            disabled={pages.isFetchingNextPage}
            onClick={() => void pages.fetchNextPage()}
          >
            {t('chat.history.more')}
          </Button>
        ) : null}
      </div>
      <div className='flex shrink-0 items-center gap-1 border-t px-2 py-2'>
        <Button
          variant='ghost'
          size='sm'
          aria-pressed={archived}
          title={t('chat.history.archived')}
          className={cn(
            'h-8 min-w-0 gap-1.5 px-2 text-xs font-normal text-muted-foreground hover:text-foreground',
            archived && 'bg-muted text-foreground',
          )}
          onClick={() => setArchived(!archived)}
          data-testid='chat-history-archived'
        >
          <ArchiveIcon className='size-4 shrink-0' />
          <span className='truncate'>{t('chat.history.archived')}</span>
        </Button>
      </div>
    </div>
  );
}

function HistoryRow({
  item,
  active,
  onOpen,
  onOpenPage,
}: {
  readonly item: ConversationSummary;
  readonly active: boolean;
  readonly onOpen: () => void;
  readonly onOpenPage: (() => void) | null;
}): ReactElement {
  const { t } = useChatTranslation();
  const format = useFormatters();
  const actions = useConversationActions();
  const sources = useConversationSources();
  const agentText = useAgentText();
  const shown = item.title?.trim() ? item.title : t('chat.untitled');
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(item.title ?? '');

  function save(): void {
    const next = title.trim().slice(0, CONVERSATION_TITLE_MAX);
    setRenaming(false);
    if (!next || next === item.title) {
      setTitle(item.title ?? '');
      return;
    }
    actions.rename.mutate({ id: item.id, title: next });
  }

  return (
    <li
      className={cn(
        'group flex min-w-0 items-center gap-1 rounded-md pr-1 hover:bg-muted',
        active && 'bg-muted',
      )}
      data-conversation={item.id}
    >
      {renaming ? (
        <Input
          autoFocus
          value={title}
          maxLength={CONVERSATION_TITLE_MAX}
          className='m-1 h-8'
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
              setTitle(item.title ?? '');
              setRenaming(false);
            }
          }}
        />
      ) : (
        <button
          type='button'
          className='flex min-h-12 min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md px-2.5 py-1.5 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
          aria-current={active ? 'true' : undefined}
          onClick={onOpen}
        >
          <span className='flex w-full min-w-0 items-center gap-1.5'>
            {chatIsRunning(item) ? <Pulse /> : null}
            <span
              className={cn(
                'truncate text-sm',
                item.read ? 'font-medium' : 'font-semibold',
              )}
              title={shown}
            >
              {shown}
            </span>
            {!item.read ? (
              <span
                className='ml-auto size-2 shrink-0 rounded-full bg-primary'
                role='img'
                aria-label={t('chat.history.unread')}
              />
            ) : null}
          </span>
          <span className='flex w-full min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
            <time
              className='shrink-0 whitespace-nowrap'
              dateTime={item.lastMessageAt}
            >
              {format.relative(item.lastMessageAt)}
            </time>
            <span aria-hidden='true'>·</span>
            <span className='truncate'>
              {agentText.name(item.agent) ?? t('chat.agentGone')}
            </span>
            {item.source === 'panel' ? null : (
              <ChatTag tone='grey' className='ml-auto'>
                {sources.find((candidate) => candidate.key === item.source)
                  ?.label ?? item.source}
              </ChatTag>
            )}
          </span>
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('chat.history.actions', { title: shown })}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-auto min-w-40'>
          <DropdownMenuGroup>
            {onOpenPage ? (
              <DropdownMenuItem onClick={onOpenPage}>
                <Maximize2Icon />
                {t('chat.openPage')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => {
                setTitle(item.title ?? '');
                setRenaming(true);
              }}
            >
              <PencilIcon />
              {t('chat.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                actions.archive.mutate({
                  id: item.id,
                  archived: !item.archivedAt,
                })
              }
            >
              {item.archivedAt ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
              {item.archivedAt ? t('chat.unarchive') : t('chat.archive')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/**
 * The person's conversations in a dialog (search, filters, rename, archive), for a page rather than the panel: a row
 * opens the conversation with `onOpen` and closes the dialog.
 */
export interface ChatHistoryDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onOpen: (conversationId: string) => void;
  readonly activeId?: string | null;
}

export function ChatHistoryDialog({
  open,
  onOpenChange,
  onOpen,
  activeId = null,
}: ChatHistoryDialogProps): ReactElement {
  const { t } = useChatTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex max-h-[calc(100dvh-2rem)] flex-col gap-3 sm:max-w-lg'
        {...{ [CHAT_PANEL_ATTRIBUTE]: '' }}
        data-testid='chat-history-dialog'
      >
        <DialogHeader>
          <DialogTitle>{t('chat.history.title')}</DialogTitle>
        </DialogHeader>
        <div className='-mx-3 -mb-3 flex min-h-0 flex-1 flex-col'>
          {open ? (
            <HistoryList
              activeId={activeId}
              onOpen={(id) => {
                onOpenChange(false);
                onOpen(id);
              }}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
